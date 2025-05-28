def result_txt_dict(result_dict):
    formatted_text = ""
    for key, value in result_dict.items():
        # Извлекаем имя региона и подтипы из строки value

        region_name = value["name"]
        true_subtypes = [k for k, v in value["subreg"].items() if v]
        if not true_subtypes:
            continue

        subtypes = ", ".join(true_subtypes)

        # Форматируем строку для текущего региона
        region_text = f"[{key}] {region_name} : ({subtypes})"

        # Добавляем строку в итоговый текст
        formatted_text += region_text + "\n\n"

    return formatted_text.strip()
