from search.database import engine, Base
from chat.models.chat_message import ChatMessage
from chat.models.chat_media import ChatMedia

print("creating chat tables...")


# This creates tables only if they don't already exist
Base.metadata.create_all(bind=engine, checkfirst=True)

print("Chat tables ensured successfully")

