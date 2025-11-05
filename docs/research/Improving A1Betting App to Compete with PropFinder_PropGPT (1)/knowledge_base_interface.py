import json

class KnowledgeBase:
    def __init__(self, base_path="/home/ubuntu/A1Betting7-13.2/tools/code_analyzer/"):
        self.frontend_components = self._load_json(base_path + "frontend_components.json")
        self.backend_endpoints = self._load_json(base_path + "backend_endpoints.json")
        self.backend_pydantic_models = self._load_json(base_path + "backend_pydantic_models.json")

    def _load_json(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"Warning: Knowledge base file not found: {file_path}")
            return []
        except json.JSONDecodeError:
            print(f"Warning: Could not decode JSON from file: {file_path}")
            return []

    def get_frontend_component(self, name):
        for comp in self.frontend_components:
            if comp["name"] == name:
                return comp
        return None

    def search_frontend_components(self, keyword):
        results = []
        for comp in self.frontend_components:
            if keyword.lower() in comp["name"].lower() or \
               (comp.get("filePath") and keyword.lower() in comp["filePath"].lower()):
                results.append(comp)
        return results

    def get_backend_endpoint(self, path=None, name=None):
        for ep in self.backend_endpoints:
            if (path and ep["path"] == path) or (name and ep["name"] == name):
                return ep
        return None

    def search_backend_endpoints(self, keyword):
        results = []
        for ep in self.backend_endpoints:
            if keyword.lower() in ep["path"].lower() or \
               keyword.lower() in ep["name"].lower() or \
               (ep.get("filePath") and keyword.lower() in ep["filePath"].lower()):
                results.append(ep)
        return results

    def get_pydantic_model(self, name):
        for model in self.backend_pydantic_models:
            if model["name"] == name:
                return model
        return None

    def search_pydantic_models(self, keyword):
        results = []
        for model in self.backend_pydantic_models:
            if keyword.lower() in model["name"].lower() or \
               (model.get("filePath") and keyword.lower() in model["filePath"].lower()):
                results.append(model)
        return results

# Example Usage (for testing purposes)
if __name__ == "__main__":
    kb = KnowledgeBase()
    print("\n--- Frontend Components ---")
    print(f"Total frontend components: {len(kb.frontend_components)}")
    player_dash = kb.get_frontend_component("PlayerDashboard")
    if player_dash:
        print("Found PlayerDashboard: " + player_dash.get("filePath", "N/A"))
    else:
        print("PlayerDashboard not found.")
    
    search_results = kb.search_frontend_components("Auth")
    print(f"Found {len(search_results)} components related to 'Auth'.")

    print("\n--- Backend Endpoints ---")
    print(f"Total backend endpoints: {len(kb.backend_endpoints)}")
    recommend_ep = kb.get_backend_endpoint(path="/api/recommendations/predict")
    if recommend_ep:
        print("Found recommendation endpoint: " + recommend_ep.get("filePath", "N/A"))
    else:
        print("Recommendation endpoint not found.")
    
    search_results = kb.search_backend_endpoints("user")
    print(f"Found {len(search_results)} endpoints related to 'user'.")

    print("\n--- Pydantic Models ---")
    print(f"Total Pydantic models: {len(kb.backend_pydantic_models)}")
    bet_rec_model = kb.get_pydantic_model("BettingRecommendation")
    if bet_rec_model:
        print("Found BettingRecommendation model: " + bet_rec_model.get("filePath", "N/A"))
    else:
        print("BettingRecommendation model not found.")
    
    search_results = kb.search_pydantic_models("User")
    print(f"Found {len(search_results)} Pydantic models related to 'User'.")

