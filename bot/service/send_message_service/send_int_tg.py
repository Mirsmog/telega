from packages.bot.create_bot import bot, asyncio

# Очереди
priority_queue = asyncio.Queue()
broadcast_queue = asyncio.Queue()
send_semaphore = asyncio.Semaphore(29)
priority_active = False


async def send_with_limit(
    content_type="text",
    chat_id=None,
    document=None,
    text=None,
    reply_markup=None,
    photo=None,
    parse_mode=None,
    **kwargs
):
    async with send_semaphore:
        try:
            if content_type == "text":
                await bot.send_message(chat_id, text, reply_markup=reply_markup, parse_mode=parse_mode, **kwargs)
            elif content_type == "photo":
                with open(photo, "rb") as photo_patch:
                    await bot.send_photo(chat_id, photo_patch, caption=text, reply_markup=reply_markup, **kwargs)
            elif content_type == "document":
                await bot.send_document(chat_id, document, caption=text, reply_markup=reply_markup, **kwargs)
        except Exception as e:
            print(e)


async def process_priority_queue():
    global priority_active
    while True:
        message_data = await priority_queue.get()
        priority_active = True
        await send_with_limit(**message_data)
        priority_active = False


async def process_broadcast_queue():
    while True:
        # Если приоритетная очередь активна, ждем
        while priority_active:
            await asyncio.sleep(0.1)

        message_data = await broadcast_queue.get()
        await send_with_limit(**message_data)
