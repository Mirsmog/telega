from packages.bot.create_bot import StatesGroup, State, FSMContext, Dispatcher, types, bot
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.database import custumer_db, performer_db, order_db
from packages.bot.keyboard import custumer_kb
from packages.bot.handlers import custumer
from packages.bot.service import get_orders
import datetime


class Report(StatesGroup):
    RepUser = State()


class Cancel(StatesGroup):
    CancUser = State()


async def process_report(m: types.Message, state: FSMContext):
    if m.text == "Назад":
        await state.finish()
        user_info = await custumer_db.find_custumer(m.from_user.id)
        orders = await get_orders.get_orders(m.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f'Всего заявок: {len(user_info["orders"])}\n'
                f'Выполнено: {user_info["order_all"]["done"]}\n'
                f'Отменены: {user_info["order_all"]["cancel"]}',
                "reply_markup": custumer_kb.all_bid(orders),
            }
        )
    else:
        data = await state.get_data()
        orders = await get_orders.get_orders(m.from_user.id)
        order = await order_db.find_order(data["order"])
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f"Ваша жалоба отправлена Администратору\n",
                "reply_markup": custumer_kb.all_bid(orders),
            }
        )
        for i in order["performer"]:
            current_time = datetime.datetime.now().strftime("%d.%m.%y %H:%M")
            log_initial_message = {"message": m.text, "date": current_time, "user": m.from_user.id}
            report = {"report": log_initial_message}
            send_report = {"send_report": log_initial_message}
            await performer_db.update_report(i, report)
            await custumer_db.update_send_report(m.from_user.id, send_report)
            await send_int_tg.priority_queue.put(
                {
                    "content_type": "text",
                    "chat_id": -1001969553521,
                    "text": f"Поступила жалоба: \n{m.text}\n" f"На исполнителя {i}\n",
                }
            )

    await state.finish()


async def process_cancel(m: types.Message, state: FSMContext):
    if m.text == "Назад":
        await state.finish()
        user_info = await custumer_db.find_custumer(m.from_user.id)
        orders = await get_orders.get_orders(m.from_user.id)
        await send_int_tg.priority_queue.put(
            {
                "content_type": "text",
                "chat_id": m.from_user.id,
                "text": f'Всего заявок: {len(user_info["orders"])}\n'
                f'Выполнено: {user_info["order_all"]["done"]}\n'
                f'Отменены: {user_info["order_all"]["cancel"]}',
                "reply_markup": custumer_kb.all_bid(orders),
            }
        )
    else:
        pass


def register_handler_work_cus(dp: Dispatcher):
    dp.register_message_handler(process_report, state=Report.RepUser)
    dp.register_callback_query_handler(process_cancel, state=Cancel.CancUser)
