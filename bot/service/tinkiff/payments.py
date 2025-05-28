import requests
import hashlib
import uuid
from config import TER_KEY, TIN_TOKEN
from packages.bot.database import payments_db, custumer_db, user_db, performer_db, server_db, paymentinfo_db
from packages.bot.service.send_message_service import send_int_tg
from packages.bot.keyboard import main_kb, custumer_kb
from datetime import datetime


class TinkoffPayment:

    def __init__(self):
        self.terminal_key = TER_KEY
        self.token = TIN_TOKEN
        self.url = "https://securepay.tinkoff.ru/v2/Init"

    def generate_sign(self, payload):
        payload_values = list(map(str, [payload[key] for key in sorted(payload.keys())]))
        payload_values.append(self.token)
        sign = hashlib.sha256(";".join(payload_values).encode("utf-8")).hexdigest()
        return sign

    async def initiate_payment(self, amount, user_id):
        order_id = str(uuid.uuid4())
        await payments_db.create_bid(user_id, amount / 100, order_id)
        payload = {
            "TerminalKey": self.terminal_key,
            "Amount": amount,
            "OrderId": order_id,
        }
        payload["Token"] = self.generate_sign(payload)

        response = requests.post(self.url, json=payload)

        if response.status_code == 200:
            return response.json()
        else:
            return None


async def update_bid():
    # Получение последних 300 платежей с полями new=True и status='create'
    bids = await payments_db.find_bid()
    for document in bids:
        current_status = document["status"]
        user_id = document["user_id"]
        if current_status == "create":
            print("Заявка создана")
        elif current_status == "CONFIRMED":
            await payments_db.update_bid(document["_id"], "success")
            if document["user_st"] == "performer":
                await performer_db.update_balance_bid(user_id=int(document["user_id"]), balance=document["amount"])
                operation = await paymentinfo_db.count_doc()
                date = datetime.now()
                await paymentinfo_db.add_info(
                    user_id=int(document["user_id"]),
                    coment="Пополнение счета",
                    operation=operation,
                    date=date,
                    amount=int(document["amount"]),
                    status="Пополнение",
                    who="performer",
                    order_id=document["order_id"],
                )
                await send_int_tg.send_with_limit(
                    content_type="text",
                    chat_id=document["user_id"],
                    text=f'Баланс пополнен на{document["amount"]} рублей',
                    reply_markup=main_kb.balance(),
                )
            elif document["user_st"] == "custumer":
                print(document)
                await custumer_db.update_balance_bid(user_id=int(document["user_id"]), balance=document["amount"])
                info_server = await server_db.get_tariff()

                url_custumer = info_server["customer_link"]
                custumer = await custumer_db.find_custumer(int(document["user_id"]))
                await send_int_tg.priority_queue.put(
                    {
                        "content_type": "text",
                        "chat_id": int(document["user_id"]),
                        "text": f"Привет {custumer['name']}\n" f"Меню заказчика",
                        "reply_markup": custumer_kb.custumer_main(url_custumer),
                    }
                )
            else:
                print("проблемка 75 payments.py")
        elif current_status == "failure":
            print("Платеж не удался")
        else:
            print(f"Неизвестный статус: {current_status}")
