#!/usr/bin/env python3
"""
Generate nginx configuration from routes.yaml using Jinja2 template.
"""
import os
import sys
import yaml
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, TemplateNotFound

def main():
    # Get script directory
    script_dir = Path(__file__).parent
    backend_dir = script_dir.parent
    project_root = backend_dir.parent.parent
    
    # Paths
    routes_yaml = backend_dir / 'routes.yaml'
    template_dir = script_dir / 'templates'
    template_file = 'nginx.conf.j2'
    output_file = backend_dir / 'deployment' / 'nginx.conf'
    
    # Check if routes.yaml exists
    if not routes_yaml.exists():
        print(f"Error: {routes_yaml} not found", file=sys.stderr)
        sys.exit(1)
    
    # Load routes configuration
    try:
        with open(routes_yaml, 'r') as f:
            config = yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"Error parsing YAML: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"Error: {routes_yaml} not found", file=sys.stderr)
        sys.exit(1)
    
    # Validate configuration
    if 'server' not in config:
        print("Error: 'server' section not found in routes.yaml", file=sys.stderr)
        sys.exit(1)
    
    if 'routes' not in config:
        print("Error: 'routes' section not found in routes.yaml", file=sys.stderr)
        sys.exit(1)
    
    # Load Jinja2 template
    try:
        env = Environment(
            loader=FileSystemLoader(str(template_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
        template = env.get_template(template_file)
    except TemplateNotFound:
        print(f"Error: Template {template_file} not found in {template_dir}", file=sys.stderr)
        sys.exit(1)
    
    # Render template
    try:
        output = template.render(
            server=config['server'],
            routes=config['routes']
        )
    except Exception as e:
        print(f"Error rendering template: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Write output
    try:
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w') as f:
            f.write(output)
        print(f"Successfully generated nginx config: {output_file}")
    except Exception as e:
        print(f"Error writing output file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
