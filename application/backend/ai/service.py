"""
OpenRouter AI service for intelligent SQL query generation and execution.
"""
import json
import time
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import requests

from .config import ai_config
from .sql_executor import SQLExecutor


class GeminiSQLService:
    """
    Service that uses OpenRouter AI (DeepSeek R1) to understand natural language queries,
    generate SQL, execute it, and provide intelligent responses.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.sql_executor = SQLExecutor(db)
        
        if not ai_config.OPENROUTER_API_KEY:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable is not set."
            )
    
    def _get_schema_context(self) -> str:
        """Get database schema as context for the AI."""
        schema_info = self.sql_executor.get_schema_info()
        if not schema_info["success"]:
            return "Unable to retrieve database schema."
        
        schema_text = "Database Schema:\n\n"
        for table_name, table_info in schema_info["schema"].items():
            schema_text += f"Table: {table_name}\n"
            if table_info["description"]:
                schema_text += f"Description: {table_info['description']}\n"
            schema_text += "Columns:\n"
            for col in table_info["columns"]:
                key_info = f" ({col['key']})" if col['key'] else ""
                nullable = " NULL" if col['nullable'] else " NOT NULL"
                desc = f" - {col['description']}" if col['description'] else ""
                schema_text += f"  - {col['name']}: {col['type']}{nullable}{key_info}{desc}\n"
            schema_text += "\n"
        
        return schema_text
    
    def _create_tools_definition(self) -> List[Dict]:
        """Create OpenAI function calling tools definition."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "execute_sql_select",
                    "description": (
                        "Execute a SELECT SQL query against the database and return the results. "
                        "ONLY SELECT queries are allowed - no INSERT, UPDATE, DELETE, or other data modification. "
                        "Use this to retrieve data from the database to answer user questions."
                    ),
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The SELECT SQL query to execute. Must be a valid MySQL SELECT statement."
                            },
                            "purpose": {
                                "type": "string",
                                "description": "Brief explanation of why you're running this query."
                            }
                        },
                        "required": ["query", "purpose"]
                    }
                }
            }
        ]
    
    def _handle_function_call(self, function_call) -> Dict[str, Any]:
        """Handle a function call from the AI."""
        if function_call["name"] == "execute_sql_select":
            args = json.loads(function_call["arguments"])
            query = args.get("query", "")
            purpose = args.get("purpose", "No purpose specified")
            
            print(f"[AI SQL] Executing: {query}")
            print(f"[AI SQL] Purpose: {purpose}")
            
            result = self.sql_executor.execute_select(query)
            return result
        
        return {"success": False, "error": f"Unknown function: {function_call['name']}"}
    
    async def query(self, user_prompt: str, user_id: int = None, user_role: str = None) -> Dict[str, Any]:
        """
        Process a natural language query, potentially executing SQL queries.
        
        Args:
            user_prompt: The user's natural language question
            user_id: ID of the logged-in user for personalized responses
            user_role: Role of the logged-in user (student, tutor, admin)
            
        Returns:
            Dictionary with the AI's response and any queries executed
        """
        schema_context = self._get_schema_context()
        
        # Build user context for personalization
        user_context = ""
        if user_id:
            user_context = f"""
CURRENT USER CONTEXT:
- User ID: {user_id}
- User Role: {user_role or 'unknown'}

PERSONALIZATION RULES:
1. If the user is a tutor (role='tutor'), EXCLUDE them from tutor search results by adding WHERE user_id != {user_id}
2. DISTINGUISHING "SCHEDULE" vs "BOOKINGS":
   - "Find me sessions", "Find tutors", "sessions that fit my schedule": This is a SEARCH for NEW availability. Query 'availability_slots' and 'tutor_profiles'. Do NOT query 'bookings' unless the user explicitly asks for "my booked sessions" or "appointments I made".
   - "My schedule", "My bookings", "What do I have coming up?": Query the 'bookings' table for EXISTING confirmed sessions.
3. If querying 'bookings' for the current user:
   - For students: WHERE student_id = {user_id}
   - For tutors: WHERE tutor_id = {user_id} (need to get tutor_id from tutor_profiles first)
4. The bookings table has: booking_id, tutor_id, student_id, scheduled_time, duration_minutes, status, notes
5. Use these user IDs to access their personal data ONLY when requested.
"""
        
        system_message = f"""You are an intelligent database assistant for a tutoring platform. 
Your role is to help users query and understand data from the database.

{schema_context}
{user_context}

ACTUAL DATABASE TABLES:
- users: All users (students and tutors)
- tutor_profiles: Tutor-specific information (links to users via user_id)
- tutor_courses: Links tutors to courses they teach (tutor_id → tutor_profiles.tutor_id, course_id → courses.course_id)
- courses: Course information (course_id, department_code, course_number, title)
- availability_slots: Tutor availability schedules (tutor_id → tutor_profiles.tutor_id)
  - weekday: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  - start_time, end_time: Time slots when tutor is available
- bookings: Session bookings between students and tutors
  - tutor_id, student_id, scheduled_time, duration_minutes, status, notes
- messages: Chat messages between users
- reports: User reports
- tutor_course_requests: Requests from tutors to teach courses

KEY RELATIONSHIPS:
- To find tutors: JOIN users with tutor_profiles ON users.user_id = tutor_profiles.user_id
- To filter by course/subject: JOIN tutor_courses and courses
- To filter by availability: JOIN availability_slots (NOT tutor_availability)

IMPORTANT INSTRUCTIONS:
1. ALWAYS write and execute a SQL query to answer questions about tutors, courses, or availability. NEVER make up data.
2. Format your SQL queries between <SQL> and </SQL> tags.
3. For questions about tutors with specific criteria, use JOINs properly.
4. ONLY use SELECT queries - no INSERT, UPDATE, DELETE, or other modifications.
5. Provide your COMPLETE answer in ONE response. Do NOT ask for continuation.
6. The database uses MySQL syntax.
7. CRITICAL: ONLY report data that comes from actual query results. NEVER invent tutor names or details.
8. If a query returns 0 rows, say "I couldn't find any tutors/courses matching those criteria."
9. IMPORTANT: If the user is a tutor searching for tutors, exclude themselves from results.
10. INTERPRETATION: "Find me sessions" or "Find tutors" means SEARCHING for available tutors (availability_slots). "My schedule" or "My bookings" means checking existing appointments (bookings).
11. MESSAGE STYLE: Be conversational and user-focused. Do NOT mention "query", "rows", or technical details. Start with "Here are..." or "I found...".
12. FIRST RESPONSE: Your FIRST response must ALWAYS contain a SQL query in <SQL></SQL> tags. Write the SQL immediately - no preamble text.

Example for "find math tutors available on Thursdays":
<SQL>
SELECT DISTINCT u.user_id, u.first_name, u.last_name, tp.hourly_rate_cents, 
       a.start_time, a.end_time
FROM users u
JOIN tutor_profiles tp ON u.user_id = tp.user_id
JOIN tutor_courses tc ON tp.tutor_id = tc.tutor_id
JOIN courses c ON tc.course_id = c.course_id
JOIN availability_slots a ON tp.tutor_id = a.tutor_id
WHERE c.department_code = 'MATH' 
  AND a.weekday = 4
  AND u.role = 'tutor'
LIMIT 20
</SQL>

Example for "find tutors that teach math OR bio" (use LIKE with OR for flexible matching):
<SQL>
SELECT DISTINCT u.user_id, u.first_name, u.last_name, tp.hourly_rate_cents
FROM users u
JOIN tutor_profiles tp ON u.user_id = tp.user_id
JOIN tutor_courses tc ON tp.tutor_id = tc.tutor_id
JOIN courses c ON tc.course_id = c.course_id
WHERE u.role = 'tutor'
  AND (c.department_code LIKE '%MATH%' OR c.title LIKE '%math%' 
       OR c.department_code LIKE '%BIO%' OR c.title LIKE '%bio%')
LIMIT 20
</SQL>
"""
        
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt}
        ]
        
        executed_queries = []
        max_retries = 3
        base_delay = 5
        max_iterations = 3
        
        try:
            for iteration in range(max_iterations):
                # Call OpenRouter API
                for attempt in range(max_retries):
                    try:
                        request_data = {
                            "model": ai_config.OPENROUTER_MODEL,
                            "messages": messages
                        }
                        
                        print(f"[AI] Sending request to OpenRouter with {len(messages)} messages")
                        
                        response = requests.post(
                            f"{ai_config.OPENROUTER_BASE_URL}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {ai_config.OPENROUTER_API_KEY}",
                                "Content-Type": "application/json",
                                "HTTP-Referer": "http://localhost:3000",
                                "X-Title": "Tutor Platform AI"
                            },
                            json=request_data,
                            timeout=60
                        )
                        
                        # Log error details if request fails
                        if not response.ok:
                            error_detail = response.text
                            print(f"[AI] OpenRouter error {response.status_code}: {error_detail}")
                            try:
                                error_json = response.json()
                                if "error" in error_json:
                                    error_detail = error_json["error"].get("message", error_detail)
                            except:
                                pass
                            raise ValueError(f"OpenRouter API error: {error_detail}")
                        
                        break
                    except requests.exceptions.RequestException as e:
                        error_str = str(e)
                        if "429" in error_str or "rate" in error_str.lower():
                            if attempt < max_retries - 1:
                                delay = base_delay * (2 ** attempt)
                                print(f"[AI] Rate limited, waiting {delay}s before retry {attempt + 1}/{max_retries}")
                                time.sleep(delay)
                            else:
                                raise
                        else:
                            raise
                
                result = response.json()
                
                if "error" in result:
                    return {
                        "success": False,
                        "error": result["error"].get("message", "Unknown API error"),
                        "queries_executed": executed_queries
                    }
                
                choice = result["choices"][0]
                ai_response = choice["message"]["content"]
                
                # Extract SQL queries from the response
                sql_pattern = r'<SQL>(.*?)</SQL>'
                sql_queries = re.findall(sql_pattern, ai_response, re.DOTALL | re.IGNORECASE)
                
                if sql_queries:
                    # Execute the SQL queries
                    for sql_query in sql_queries:
                        sql_query = sql_query.strip()
                        print(f"[AI SQL] Executing: {sql_query}")
                        
                        result = self.sql_executor.execute_select(sql_query)
                        executed_queries.append({
                            "query": sql_query,
                            "success": result.get("success", False),
                            "row_count": result.get("row_count", 0) if result.get("success") else 0,
                            "rows": result.get("rows", []) if result.get("success") else [],
                            "error": result.get("error") if not result.get("success") else None
                        })
                        
                        # Add the query results to the conversation for the AI to use
                        if result.get("success"):
                            row_count = result.get('row_count', 0)
                            rows = result.get('rows', [])
                            
                            if row_count == 0:
                                result_summary = "Query executed successfully but returned 0 rows. The data you're looking for might not exist, or the query conditions might be too restrictive."
                            else:
                                result_summary = f"Query executed successfully. Returned {row_count} rows.\n\n"
                                if rows:
                                    # Format results in a readable way
                                    result_summary += "Results:\n"
                                    for idx, row in enumerate(rows[:10], 1):
                                        result_summary += f"{idx}. {json.dumps(row)}\n"
                                    if row_count > 10:
                                        result_summary += f"\n... and {row_count - 10} more rows"
                            
                            messages.append({"role": "assistant", "content": ai_response})
                            messages.append({"role": "user", "content": f"{result_summary}\n\nBased on ONLY these results, provide a brief summary. CRITICAL: Use ONLY the names and details from the results above. Do NOT invent any tutor names. Say 'Here are the tutors...' and list ONLY what the data shows."})
                            break  # Get AI's interpretation of results
                        else:
                            error_msg = result.get('error', 'Unknown error')
                            print(f"[AI SQL] Query failed: {error_msg}")
                            messages.append({"role": "assistant", "content": ai_response})
                            messages.append({"role": "user", "content": f"That query failed with error: {error_msg}. Please write a corrected query or try a simpler approach."})
                            break  # Let AI try again
                    
                    # If we executed queries, continue to get the final answer
                    if executed_queries:
                        continue
                
                # No SQL queries found, this is the final response
                # Remove SQL tags from the response for cleaner output
                clean_response = re.sub(r'<SQL>.*?</SQL>', '', ai_response, flags=re.DOTALL | re.IGNORECASE).strip()
                
                return {
                    "success": True,
                    "response": clean_response if clean_response else ai_response,
                    "queries_executed": executed_queries,
                    "function_calls": len(executed_queries)
                }
            
            # If we exit the loop, return what we have
            clean_response = re.sub(r'<SQL>.*?</SQL>', '', ai_response, flags=re.DOTALL | re.IGNORECASE).strip()
            return {
                "success": True,
                "response": clean_response if clean_response else ai_response,
                "queries_executed": executed_queries,
                "function_calls": len(executed_queries)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "queries_executed": executed_queries
            }
    
    def query_sync(self, user_prompt: str) -> Dict[str, Any]:
        """
        Synchronous version of query for non-async contexts.
        """
        import asyncio
        
        # Check if there's already a running event loop
        try:
            loop = asyncio.get_running_loop()
            # If we're in an async context, create a new task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, self.query(user_prompt))
                return future.result()
        except RuntimeError:
            # No running loop, we can use asyncio.run
            return asyncio.run(self.query(user_prompt))
