from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import CopilotQueryRequest, CopilotQueryResponse
from app.agents.controller import ai_controller
from app.services.audit_service import create_audit_entry

router = APIRouter(prefix="/api/copilot", tags=["FinPilot Copilot"])

@router.post("", response_model=CopilotQueryResponse)
async def query_copilot(
    query_req: CopilotQueryRequest,
    db: Session = Depends(get_db)
):
    """
    Interacts with FinPilot Copilot.
    Routes queries to specialized agents, aggregates ledger facts,
    and returns a substantiated response.
    """
    response_data = await ai_controller.process_financial_query(
        db=db,
        question=query_req.question,
        history=query_req.conversation_history
    )

    create_audit_entry(
        db=db,
        action="COPILOT_QUERY_PROCESSED",
        entity="copilot",
        entity_id="copilot_session",
        user="Finance Controller",
        ai_agent="AI Controller Orchestrator",
        previous_value="",
        new_value=f"Q: {query_req.question[:60]}...",
        details=f"Agents consulted: {', '.join(response_data['active_agents'])}"
    )

    return response_data
