from packages.bot.create_bot import InlineKeyboardButton, InlineKeyboardMarkup
from packages.bot.middlewares import tinkof_pay


def custumer_main(url):
    kb_1 = InlineKeyboardButton("Новая заявка", callback_data="customer_order")
    kb_2 = InlineKeyboardButton("Мои заявки", callback_data="customer_bid")
    kb_3 = InlineKeyboardButton("Мой профиль", callback_data="customer_profile")
    kb_7 = InlineKeyboardButton("Мой баланс", callback_data="customer_balance")
    kb_4 = InlineKeyboardButton("Видео инструкция", url=url)
    kb_5 = InlineKeyboardButton("Обратная связь", callback_data="customer_feedback")
    kb_6 = InlineKeyboardButton("Поделиться ссылкой", callback_data="customer_link")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1, kb_2)
    re_kb.add(kb_3, kb_7)
    re_kb.add(kb_4, kb_5)
    re_kb.add(kb_6)
    return re_kb


def menu():
    kb = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb)
    return re_kb


def all_bid(orders, page=1, max_buttons_in_row=2, orders_per_page=12):
    excluded_statuses = ["finish", "im_cancel", "canceled", "pf_cancel"]
    filtered_orders = [order for order in orders if order["status"] not in excluded_statuses]

    # Ваши параметры для постраничного вывода
    start_index = (page - 1) * orders_per_page
    end_index = start_index + orders_per_page

    # Фильтрация списка заказов для текущей страницы
    page_orders = filtered_orders[start_index:end_index]

    keyboard = InlineKeyboardMarkup(row_width=max_buttons_in_row)

    for order in page_orders:
        status_emoji = {
            "wait": "🟠",
            "canceled": "⛔️",
            "search": "🌀",
            "create": "⏳",
            "im_cancel": "❌",
            "in_work": "✅",
        }

        button_text = f"Заявка #{order['order_number']} {status_emoji.get(order['status'], '')}"

        callback_data = f"cusmyorder:{str(order['_id'])}"

        keyboard.insert(InlineKeyboardButton(text=button_text, callback_data=callback_data))

    # Добавление кнопок навигации
    nav_buttons = []
    if page > 1:
        nav_buttons.append(InlineKeyboardButton("⬅️ Предыдущая", callback_data=f"cuspage:{page - 1}"))

    if end_index < len(filtered_orders):
        nav_buttons.append(InlineKeyboardButton("Следующая ➡️", callback_data=f"cuspage:{page + 1}"))

    keyboard.row(*nav_buttons)
    keyboard.add(InlineKeyboardButton("Назад", callback_data="start_command"))

    return keyboard


def order_menu(call):
    obj = call.split(":")[1]
    kb_1 = InlineKeyboardButton("Отменить заявку", callback_data=f"ordmen_cancel_{obj}")
    # не было в ТЗ решил не делать(потому что много лишнего кода
    kb_3 = InlineKeyboardButton("Назад", callback_data="customer_bid")
    keyboard = InlineKeyboardMarkup()
    keyboard.add(kb_1)
    keyboard.add(kb_3)
    return keyboard


def order_menu_work(call):
    obj = call.split(":")[1]
    kb_0 = InlineKeyboardButton("Заявка успешно выполнена", callback_data=f"ordmen_fin_{obj}")
    kb_1 = InlineKeyboardButton("Отменить заявку", callback_data=f"ordmen_cancel_{obj}")
    kb_2 = InlineKeyboardButton("Подать жалобу", callback_data=f"ordmen_report_{obj}")
    kb_3 = InlineKeyboardButton("Назад", callback_data="customer_bid")
    keyboard = InlineKeyboardMarkup()
    keyboard.add(kb_0)
    keyboard.add(kb_1)
    keyboard.add(kb_2)
    keyboard.add(kb_3)
    return keyboard


def order_new(user_id, car, obj, pos):
    kb_1 = InlineKeyboardButton("Выбрать исполнителя", callback_data=f"pt:{user_id}:{car}:{obj}")
    kb_2 = InlineKeyboardButton("Отказаться", callback_data=f"dont:{user_id}:{obj}")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    return re_kb


def how_car(need_car, obj):
    keyboard = InlineKeyboardMarkup()
    for i in range(need_car - 1, 0, -1):
        print(i)
        button_text = str(i)
        callback_data = f"mocar:{str(i)}:{obj}"

        keyboard.add(InlineKeyboardButton(text=button_text, callback_data=callback_data))

    kb_3 = InlineKeyboardButton("Больше не искать", callback_data=f"mocar:stop:{obj}")
    keyboard.add(kb_3)
    return keyboard


async def pay_70(user_id):
    response = await tinkof_pay.get_url(99, user_id)
    kb_1 = InlineKeyboardButton("Оплатить 99р и разместить заявку", url=response)
    kb_2 = InlineKeyboardButton("Назад", callback_data="start_command")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    return re_kb


def acept_price(manage_obj, pos):
    kb_1 = InlineKeyboardButton("Выбрать исполнителя", callback_data=f"jk:{manage_obj}:{pos}")
    kb_2 = InlineKeyboardButton("Удалить предложение", callback_data="jk:del:1")
    re_kb = InlineKeyboardMarkup()
    re_kb.add(kb_1)
    re_kb.add(kb_2)
    return re_kb
