import json
import os
from knowledge_base_interface import KnowledgeBase
from prompt_templates import PROMPT_TEMPLATES

class DynamicPromptGenerator:
    def __init__(self, codebase_root="/home/ubuntu/A1Betting7-13.2/"):
        self.kb = KnowledgeBase()
        self.codebase_root = codebase_root
        self.instructions_md_path = os.path.join(codebase_root, ".copilot", "instructions.md")
        self.general_instructions = self._load_general_instructions()

    def _load_general_instructions(self):
        try:
            with open(self.instructions_md_path, "r", encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            print(f"Warning: {self.instructions_md_path} not found. General instructions will be empty.")
            return ""

    def generate_prompt(self, command, additional_context=""):
        if command not in PROMPT_TEMPLATES:
            return f"Error: Command `{command}` not recognized."

        template_info = PROMPT_TEMPLATES[command]
        template = template_info["template"]
        
        # Prepare context for template filling
        context_vars = {"additional_context": additional_context}

        if command == "playerdash":
            # Example: Try to find a relevant backend endpoint for player data
            player_endpoint = self.kb.get_backend_endpoint(name="get_player_performance") or \
                              self.kb.get_backend_endpoint(path="/api/player/{playerId}/performance")
            if player_endpoint:
                context_vars["backend_api_path"] = player_endpoint["path"]
                # Attempt to find a corresponding Pydantic model
                response_model_name = player_endpoint.get("response_model", "PlayerPerformanceData")
                pydantic_model = self.kb.get_pydantic_model(response_model_name)
                if pydantic_model:
                    context_vars["backend_api_response_model"] = pydantic_model["name"]
                else:
                    context_vars["backend_api_response_model"] = response_model_name + " (Pydantic model not found, suggest defining)"
            else:
                context_vars["backend_api_path"] = "/api/player/{playerId}/performance (suggest defining)"
                context_vars["backend_api_response_model"] = "PlayerPerformanceData (suggest defining)"
            
            # Example: Suggest frontend location based on common patterns
            context_vars["frontend_location"] = "frontend/src/components/PlayerDashboard.tsx"

        elif command == "aibetreco":
            context_vars["backend_location"] = "backend/app/api/endpoints/recommendations.py"
            context_vars["endpoint_path"] = "/api/recommendations/predict"
            context_vars["ml_response_model"] = "BettingRecommendation"

        elif command == "dataingest":
            context_vars["data_ingestion_location"] = "backend/app/services/data_ingestion.py"

        elif command == "mobileref":
            # Example: Try to find SharedStatDisplay component
            shared_stat_display = self.kb.get_frontend_component("SharedStatDisplay")
            if shared_stat_display:
                context_vars["target_file_path"] = shared_stat_display["filePath"]
                context_vars["target_component_name"] = shared_stat_display["name"]
            else:
                context_vars["target_file_path"] = "frontend/src/components/SharedStatDisplay.tsx (suggest creating)"
                context_vars["target_component_name"] = "SharedStatDisplay"

        # Fill the template with dynamic context
        filled_prompt = template
        for key, value in context_vars.items():
            filled_prompt = filled_prompt.replace(f"{{{{key}}}}", str(value))

        # Augment with general instructions
        final_prompt = self.general_instructions + "\n\n---\n\n" + filled_prompt
        
        return final_prompt

# Example Usage (for testing purposes)
if __name__ == "__main__":
    generator = DynamicPromptGenerator()

    print("\n--- Generating /playerdash prompt ---")
    playerdash_prompt = generator.generate_prompt("playerdash", "Focus on integrating with the new real-time data websocket.")
    print(playerdash_prompt)

    print("\n--- Generating /aibetreco prompt ---")
    aibetreco_prompt = generator.generate_prompt("aibetreco")
    print(aibetreco_prompt)

    print("\n--- Generating /dataingest prompt ---")
    dataingest_prompt = generator.generate_prompt("dataingest", "Ensure compatibility with the new distributed logging system.")
    print(dataingest_prompt)

    print("\n--- Generating /mobileref prompt ---")
    mobileref_prompt = generator.generate_prompt("mobileref")
    print(mobileref_prompt)

    print("\n--- Generating unknown command prompt ---")
    unknown_prompt = generator.generate_prompt("unknown_command")
    print(unknown_prompt)


