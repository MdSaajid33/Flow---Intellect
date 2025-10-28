from typing import Dict, Any
from .base import BaseComponent

class UserQueryComponent(BaseComponent):
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"query": input_data.get("query", "")}