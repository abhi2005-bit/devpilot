import json
from app.services.groq_service import groq_service
from app.schemas.investigation import StructuredInvestigation, AIInvestigationAnalysis

class AIInvestigationService:
    async def analyze_investigation(
        self,
        investigation: StructuredInvestigation,
    ) -> AIInvestigationAnalysis:
        
        # Serialize the deterministic context to JSON
        context_data = investigation.model_dump(exclude={"ai_analysis"})
        
        system_prompt = """
You are DevPilot's Engineering Investigation Assistant.

Your job is to reason about software engineering problem data
and produce a structured explanation that helps engineers understand what is happening, why, and what to do next.

The supplied data comes from deterministic engineering metrics, issues, CI/CD, and traceability relationships.
This deterministic data is authoritative.

Rules:

1. Only use information present in the supplied DevPilot project context.
2. Do not invent issues, PRs, commits, CI runs, metrics, names, or events.
3. Do not assume information that is absent.
4. Do not claim certainty when evidence is insufficient.
5. Distinguish FACTS (verified from data) from INFERENCES (likely patterns or causes based on facts).
6. Recommendations must be actionable and grounded in the supplied evidence.
7. Never fabricate root causes.
8. Never execute actions or claim to have fixed an issue unless the evidence confirms it.
9. Keep the response concise but technically useful.
10. Prioritize actionable engineering reasoning.
11. Return ONLY valid JSON matching the exact requested structure.
12. Do not wrap the JSON in Markdown backticks or provide other text.

Return JSON exactly in this structure:

{
  "summary": "Brief summary of the engineering problem and context",
  "facts": [
    "Fact 1 (e.g., CI failed 4 times in the last 7 recorded runs.)",
    "Fact 2"
  ],
  "inferences": [
    {
      "statement": "The repeated failures suggest instability in the affected workflow.",
      "confidence": "HIGH|MEDIUM|LOW",
      "supporting_evidence": ["Evidence 1", "Evidence 2"]
    }
  ],
  "recommendations": [
    {
      "title": "Inspect the failing workflow's latest failed runs",
      "reason": "To compare the error signatures",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "uncertainty": [
    "What is not known from the available evidence"
  ]
}
"""

        user_prompt = f"""
Analyze this DevPilot investigation context and provide an engineering explanation.

Investigation Context:
{json.dumps(context_data, indent=2, default=str)}
"""

        response = await groq_service.generate(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
        )

        try:
            # Sometime models add markdown backticks around JSON
            clean_json = response.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            
            parsed_response = json.loads(clean_json.strip())
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Groq returned invalid JSON."
            ) from exc

        return AIInvestigationAnalysis.model_validate(parsed_response)

ai_investigation_service = AIInvestigationService()
