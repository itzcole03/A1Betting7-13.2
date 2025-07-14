# Command registry for backend commands
COMMANDS = []
# Register the ultimate autonomous command
COMMANDS.append({
    'id': 'autonomous_project_development',
    'name': 'Autonomous Project Development',
    'description': 'Recursively and autonomously analyze, plan, and execute all tasks required to bring the main A1Betting app to a robust, error-free, production-ready state. Leverages all memory, documentation, analytics, codebase, background agents, and Cursor rules. Continuously self-improves and adapts. Requires no user input after activation.',
    'handler': 'autonomous_project_development_handler',
    'category': 'Autonomy',
    'usage': 'Trigger this command to have the agent (me) take full control of the main A1Betting app, recursively planning, coding, testing, documenting, and optimizing until all goals are met, using all Cursor infrastructure and rules.',
    'parameters': [],
    'endpoint': {'path': '/api/autonomous/development', 'method': 'POST'},
    'examples': [
        'POST /api/commands/execute { "id": "autonomous_project_development" }',
        'POST /api/autonomous/development'
    ]
}) 