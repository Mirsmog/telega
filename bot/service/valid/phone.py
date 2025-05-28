import phonenumbers


def validate_and_format_phone(phone_number: str, default_region='RU') -> str:
    """
    Валидация и форматирование номера телефона.

    :param phone_number: Номер телефона для проверки.
    :param default_region: Стандартный регион для номеров без кода страны.
    :return: Отформатированный номер телефона.
    :raises: phonenumbers.NumberParseException если номер некорректен.
    """
    try:
        parsed_number = phonenumbers.parse(phone_number, default_region)

        if not phonenumbers.is_valid_number(parsed_number):
            raise phonenumbers.NumberParseException("Invalid number", phone_number)

        return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
    except phonenumbers.NumberParseException:
        raise ValueError("Некорректный номер телефона.")