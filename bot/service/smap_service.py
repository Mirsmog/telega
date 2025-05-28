import json
import aio_pika
from service.send_message_service import send_int_tg
from handlers import admin
import asyncio

async def on_message(message: aio_pika.IncomingMessage):
    async with message.process():
        # Декодируем сообщение из байтов и парсим JSON
        message_body = message.body.decode()
        message_data = json.loads(message_body)

        # Выводим сообщение на консоль
        for i in message_data['user_list']:
            await send_int_tg.broadcast_queue.put({"content_type": "photo",
                                               "chat_id": int(i),
                                               "text": message_data['message'],
                                               "photo": message_data['image']['file_path']})

async def consume_message():
    # Устанавливаем соединение с RabbitMQ
    connection = await aio_pika.connect_robust("amqp://localhost")
    channel = await connection.channel()

    # Объявляем первую очередь и устанавливаем первый обработчик сообщений
    telegram_queue = await channel.declare_queue("telegram_queue")
    await telegram_queue.consume(on_message)

    # Объявляем вторую очередь и устанавливаем второй обработчик сообщений
    acept_tg_queue = await channel.declare_queue("acept_tg")
    await acept_tg_queue.consume(admin.acept_order)

    # Включаем обработчики сообщений до тех пор, пока не получим сигнал о завершении работы
    await asyncio.gather(
        telegram_queue.consume(on_message),
        acept_tg_queue.consume(admin.acept_order)
    )