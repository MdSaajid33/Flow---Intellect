from typing import Dict, Any
from .base import BaseComponent

class OutputComponent(BaseComponent):
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        response = input_data.get("response", "No response generated")
        return {"final_output": response, "status": "completed"}