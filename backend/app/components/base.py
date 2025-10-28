from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseComponent(ABC):
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        pass