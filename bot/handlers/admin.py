import json

from packages.bot.create_bot import Dispatcher, bot, State, StatesGroup, FSMContext, types
from packages.bot.database import custumer_db, order_db, server_db
from packages.bot.keyboard import main_kb, service_kb, custumer_kb
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.service import get_orders
import aio_pika
from database import user_db


async def accept(callback_query: types.CallbackQuery):
    call, obj = callback_query.data.split(":")
    if call == "accept_order":
        # нужно вытащить из ордера user_id, и изменить статус заявки
        order_info = await order_db.find_order(obj)

        if order_info is not None:
            if order_info["status"] == "search":
                await send_int_tg.send_with_limit(
                    content_type="text", text=f"✅ Заявка уже принята в работу.", chat_id=callback_query.message.chat.id
                )
                await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)

            elif order_info["status"] == "create":
                mes = "Заявка одобрена"
                info_server = await server_db.get_tariff()

                url_custumer = info_server["customer_link"]
                await get_orders.update_order_log(
                    order_id=obj, message=mes, user_id=callback_query.from_user.id, status="search"
                )
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "text": f'✅ Заявка #{order_info["order_number"]} принята в работу. ' f"Ищем исполнителя",
                        "chat_id": order_info["customer"],
                        "reply_markup": custumer_kb.custumer_main(url_custumer),
                    }
                )
                # await
                await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)
        else:
            await send_int_tg.send_with_limit(
                content_type="text", text=f"Заявки не существует", chat_id=callback_query.message.chat.id
            )
            await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)


async def cancel_order(callback_query: types.CallbackQuery):
    call, obj = callback_query.data.split(":")
    if call == "cancel_order":
        order_info = await order_db.find_order(obj)

        if order_info is not None:

            if order_info["status"] == "canceled":
                await send_int_tg.send_with_limit(
                    content_type="text", text=f"Заявка уже отклонена", chat_id=callback_query.message.chat.id
                )
                await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)
            elif order_info["status"] == "create":
                mes = "Заявка отклонена модератором"
                info_server = await server_db.get_tariff()
                url_custumer = info_server["customer_link"]
                await get_orders.update_order_log(
                    order_id=obj, message=mes, user_id=callback_query.from_user.id, status="canceled"
                )

                await send_int_tg.send_with_limit(
                    content_type="text",
                    text=f'❌ Заявка #{order_info["order_number"]} отклонена',
                    chat_id=order_info["customer"],
                    reply_markup=custumer_kb.custumer_main(url_custumer),
                )
        else:
            await send_int_tg.send_with_limit(
                content_type="text", text=f"Заявки не существует", chat_id=callback_query.message.chat.id
            )
            await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)


async def ok_order_delete(callback_query: types.CallbackQuery):
    print(callback_query)
    await bot.delete_message(callback_query.message.chat.id, callback_query.message.message_id)


async def acept_order(message: aio_pika.IncomingMessage):
    async with message.process():
        # Декодируем сообщение из байтов и парсим JSON
        message_body = message.body.decode()
        message_data = json.loads(message_body)
        order_info = await order_db.number_order(message_data["obj"])
        if message_data["acept"]:
            info_server = await server_db.get_tariff()

            url_custumer = info_server["customer_link"]
            mes = "Заявка одобрена"
            await get_orders.update_order_log(
                order_id=message_data["obj"], message=mes, user_id=order_info["customer"], status="search"
            )
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "text": f'✅ Заявка #{order_info["order_number"]} принята в работу. ' f"Ищем исполнителя",
                    "chat_id": order_info["customer"],
                    "reply_markup": custumer_kb.custumer_main(url_custumer),
                }
            )
        else:
            await get_orders.update_order_log(
                order_id=message_data["obj"],
                message=message_data["messages"],
                user_id=order_info["customer"],
                status="canceled",
            )

            await send_int_tg.send_with_limit(
                content_type="text",
                text=f'❌ Заявка #{order_info["order_number"]} отклонена',
                chat_id=order_info["customer"],
            )


def register_handler_admin(dp: Dispatcher):

    dp.register_callback_query_handler(accept, lambda c: c.data.startswith("accept_order:"))
    dp.register_callback_query_handler(cancel_order, lambda c: c.data.startswith("cancel_order:"))
    dp.register_callback_query_handler(ok_order_delete, lambda c: c.data == "ok_order_delete")
