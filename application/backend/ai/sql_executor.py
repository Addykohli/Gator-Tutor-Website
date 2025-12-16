"""
Safe SQL executor that only allows SELECT queries.
"""
import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from .config import ai_config


class SQLValidator:
    """Validates SQL queries to ensure only SELECT operations are allowed."""
    
    @staticmethod
    def is_safe_query(query: str) -> tuple[bool, str]:
        """
        Validate that a SQL query is safe (read-only).
        
        Args:
            query: The SQL query to validate
            
        Returns:
            Tuple of (is_safe, error_message)
        """
        # Normalize query for checking
        normalized = query.strip().upper()
        
        # Remove comments
        normalized = re.sub(r'--.*$', '', normalized, flags=re.MULTILINE)
        normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL)
        normalized = normalized.strip()
        
        # Check if it starts with SELECT
        if not normalized.startswith("SELECT"):
            return False, "Query must start with SELECT. Only read operations are allowed."
        
        # Check for forbidden keywords
        for keyword in ai_config.FORBIDDEN_SQL_KEYWORDS:
            # Use word boundary to avoid false positives (e.g., "DESCRIPTION" containing "DESCRIBE")
            pattern = r'\b' + keyword + r'\b'
            if re.search(pattern, normalized):
                return False, f"Forbidden keyword '{keyword}' detected. Only SELECT queries are allowed."
        
        # Check for multiple statements (semicolon followed by more SQL)
        # Allow trailing semicolon but not multiple statements
        statements = [s.strip() for s in query.split(';') if s.strip()]
        if len(statements) > 1:
            return False, "Multiple SQL statements are not allowed."
        
        # Check for subqueries that might modify data
        # This is a basic check - the database user should also have read-only permissions
        subquery_patterns = [
            r'\(\s*(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)',
        ]
        for pattern in subquery_patterns:
            if re.search(pattern, normalized):
                return False, "Subqueries with data modification are not allowed."
        
        return True, ""


class SQLExecutor:
    """Executes validated SQL queries safely."""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = SQLValidator()
    
    def execute_select(self, query: str) -> Dict[str, Any]:
        """
        Execute a SELECT query safely.
        
        Args:
            query: The SQL query to execute
            
        Returns:
            Dictionary with success status, columns, rows, or error message
        """
        # Validate the query first
        is_safe, error_msg = self.validator.is_safe_query(query)
        if not is_safe:
            return {
                "success": False,
                "error": error_msg,
                "query": query
            }
        
        try:
            # Execute the query
            result = self.db.execute(text(query))
            
            # Get column names
            columns = list(result.keys())
            
            # Fetch results with limit
            rows = result.fetchmany(ai_config.MAX_QUERY_RESULTS)
            
            # Convert rows to list of dicts for JSON serialization
            rows_as_dicts = []
            for row in rows:
                row_dict = {}
                for col, value in zip(columns, row):
                    # Convert non-JSON-serializable types to strings
                    if value is not None:
                        # Handle datetime/date/time/timedelta objects
                        if hasattr(value, 'isoformat'):
                            row_dict[col] = value.isoformat()
                        elif hasattr(value, 'total_seconds'):  # timedelta
                            # Convert timedelta to HH:MM:SS format
                            total_seconds = int(value.total_seconds())
                            hours = total_seconds // 3600
                            minutes = (total_seconds % 3600) // 60
                            seconds = total_seconds % 60
                            row_dict[col] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
                        else:
                            row_dict[col] = value
                    else:
                        row_dict[col] = value
                rows_as_dicts.append(row_dict)
            
            # Check if there are more results
            has_more = len(rows) == ai_config.MAX_QUERY_RESULTS
            
            return {
                "success": True,
                "columns": columns,
                "rows": rows_as_dicts,
                "row_count": len(rows_as_dicts),
                "has_more": has_more,
                "query": query
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    def get_schema_info(self) -> Dict[str, Any]:
        """
        Get database schema information to help the AI understand the structure.
        
        Returns:
            Dictionary with table and column information
        """
        try:
            # Query to get table information (MySQL specific)
            tables_query = """
                SELECT TABLE_NAME, TABLE_COMMENT 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_TYPE = 'BASE TABLE'
            """
            tables_result = self.db.execute(text(tables_query))
            tables = [{"table_name": row[0], "description": row[1]} for row in tables_result]
            
            # Get column information for each table
            schema_info = {}
            for table in tables:
                table_name = table["table_name"]
                columns_query = f"""
                    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_COMMENT
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = '{table_name}'
                    ORDER BY ORDINAL_POSITION
                """
                columns_result = self.db.execute(text(columns_query))
                columns = [
                    {
                        "name": row[0],
                        "type": row[1],
                        "nullable": row[2] == "YES",
                        "key": row[3],
                        "description": row[4]
                    }
                    for row in columns_result
                ]
                schema_info[table_name] = {
                    "description": table["description"],
                    "columns": columns
                }
            
            return {
                "success": True,
                "schema": schema_info
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
