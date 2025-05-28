from packages.bot.create_bot import bot
from packages.bot.database import performer_db, custumer_db, server_db, user_db
from packages.bot.keyboard import performer_kb, custumer_kb
from packages.bot.service.send_message_service import send_int_tg
import functools


def check_and_send_message(func):
    @functools.wraps(func)
    async def wrapper(m):
        if m.text == "/start" or m.text == "start":
            info_server = await server_db.get_tariff()
            data = await user_db.find_user(m.fron_user.id)
            url_performer = info_server["performer_link"]
            url_custumer = info_server["customer_link"]
            if data["performer"]:

                performer = performer_db.find_performer(m.from_user.id)
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": m.from_user.id,
                        "text": f"Привет {performer['name']}\n" f"Меню исполнителя",
                        "reply_markup": performer_kb.performer_main(url_performer),
                    }
                )

            elif data["custumer"]:

                custumer = await custumer_db.find_custumer(m.from_user.id)
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": m.from_user.id,
                        "text": f"Привет {custumer['name']}\n" f"Меню заказчика",
                        "reply_markup": custumer_kb.custumer_main(url_custumer),
                    }
                )
        else:
            return wrapper
