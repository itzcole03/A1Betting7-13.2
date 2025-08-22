from fastapi import APIRouter, HTTPException, BackgroundTasks

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException, AuthenticationException
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal, Dict, Any
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class FeedbackRequest(BaseModel):
    type: Literal["bug", "feature", "improvement", "other"]
    rating: int
    message: str
    feature: Optional[str] = None
    userAgent: str
    url: str
    timestamp: str

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    feedback_id: Optional[str] = None

def send_feedback_email(feedback: FeedbackRequest) -> bool:
    """Send feedback email to admin"""
    try:
        # Email configuration (you'll need to set these environment variables)
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        admin_email = "propollama@gmail.com"
        
        if not sender_email or not sender_password:
            logger.warning("SMTP credentials not configured")
            return False

        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = admin_email
        msg['Subject'] = f"A1Betting Feedback: {feedback.type.title()} - Rating: {feedback.rating}/5"

        # Email body
        body = f"""
New feedback received from A1Betting application:

Type: {feedback.type.title()}
Rating: {feedback.rating}/5 stars
Feature: {feedback.feature or 'General'}
URL: {feedback.url}
Timestamp: {feedback.timestamp}

Message:
{feedback.message}

Technical Details:
User Agent: {feedback.userAgent}

---
This feedback was automatically sent from the A1Betting application.
        """
        
        msg.attach(MIMEText(body, 'plain'))

        # Send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, admin_email, text)
        server.quit()
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to send feedback email: {e}")
        return False

def save_feedback_to_file(feedback: FeedbackRequest) -> str:
    """Save feedback to local file as backup"""
    try:
        feedback_dir = "data/feedback"
        os.makedirs(feedback_dir, exist_ok=True)
        
        feedback_id = f"feedback_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        feedback_file = os.path.join(feedback_dir, f"{feedback_id}.json")
        
        feedback_data = {
            "id": feedback_id,
            "type": feedback.type,
            "rating": feedback.rating,
            "message": feedback.message,
            "feature": feedback.feature,
            "userAgent": feedback.userAgent,
            "url": feedback.url,
            "timestamp": feedback.timestamp,
            "received_at": datetime.now().isoformat()
        }
        
        with open(feedback_file, 'w') as f:
            json.dump(feedback_data, f, indent=2)

        return feedback_id
        
    except Exception as e:
        logger.error(f"Failed to save feedback to file: {e}")
        return ""

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackRequest,
    background_tasks: BackgroundTasks
):
    """Submit user feedback"""
    try:
        # Validate rating
        if not 0 <= feedback.rating <= 5:
            raise BusinessLogicException("Rating must be between 0 and 5")
        
        # Validate message
        if not feedback.message.strip():
            raise BusinessLogicException("Feedback message is required")
        
        # Save feedback to file (backup)
        feedback_id = save_feedback_to_file(feedback)
        
        # Send email in background
        background_tasks.add_task(send_feedback_email, feedback)
        
        logger.info(f"Feedback received: {feedback.type} - Rating: {feedback.rating}/5")
        
        return ResponseBuilder.success(FeedbackResponse(
            success=True,
            message="Feedback submitted successfully",
            feedback_id=feedback_id
        ))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise BusinessLogicException("Failed to submit feedback")

@router.get("/feedback/stats", response_model=StandardAPIResponse[Dict[str, Any]])
async def get_feedback_stats():
    """Get feedback statistics (admin only)"""
    try:
        feedback_dir = "data/feedback"
        if not os.path.exists(feedback_dir):
            return ResponseBuilder.success({
                "total_feedback": 0,
                "by_type": {},
                "average_rating": 0,
                "recent_count": 0
            })
        
        feedback_files = [f for f in os.listdir(feedback_dir) if f.endswith('.json')]
        
        if not feedback_files:
            return ResponseBuilder.success({
                "total_feedback": 0,
                "by_type": {},
                "average_rating": 0,
                "recent_count": 0
            })
        
        # Load and analyze feedback
        feedback_data = []
        for file_name in feedback_files:
            try:
                with open(os.path.join(feedback_dir, file_name), 'r') as f:
                    data = json.load(f)
                    feedback_data.append(data)
            except Exception as e:
                logger.error(f"Error reading feedback file {file_name}: {e}")
        
        # Calculate statistics
        total_feedback = len(feedback_data)
        by_type = {}
        total_rating = 0
        rated_count = 0
        recent_count = 0
        
        # 7 days ago
        seven_days_ago = datetime.now().timestamp() - (7 * 24 * 60 * 60)
        
        for feedback in feedback_data:
            # Count by type
            feedback_type = feedback.get('type', 'other')
            by_type[feedback_type] = by_type.get(feedback_type, 0) + 1
            
            # Average rating
            rating = feedback.get('rating', 0)
            if rating > 0:
                total_rating += rating
                rated_count += 1
            
            # Recent feedback (last 7 days)
            try:
                feedback_time = datetime.fromisoformat(feedback.get('received_at', '')).timestamp()
                if feedback_time > seven_days_ago:
                    recent_count += 1
            except:
                pass
        
        average_rating = total_rating / rated_count if rated_count > 0 else 0
        
        return ResponseBuilder.success({
            "total_feedback": total_feedback,
            "by_type": by_type,
            "average_rating": round(average_rating, 2),
            "recent_count": recent_count
        })
        
    except Exception as e:
        logger.error(f"Error getting feedback stats: {e}")
        raise BusinessLogicException("Failed to get feedback statistics")
