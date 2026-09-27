from groq import AsyncGroq

from app.db.database import settings


class GroqService:
    def __init__(self) -> None:
        self.client = None

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        if self.client is None:
            if settings.groq_api_key is None:
                raise RuntimeError(
                    "GROQ_API_KEY is not configured."
                )

            self.client = AsyncGroq(
                api_key=settings.groq_api_key,
            )

        response = await self.client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        content = response.choices[0].message.content

        if not content:
            raise RuntimeError(
                "Groq returned an empty response."
            )

        return content


groq_service = GroqService()