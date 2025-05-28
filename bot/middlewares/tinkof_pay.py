from service.tinkiff.payments import TinkoffPayment as TF

async def get_url(amount, user_id):
    response = await TF().initiate_payment(int(amount)*100, user_id)
    if response and response.get('Success'):
        print('Payment initiated successfully.')
        print(f"Payment URL: {response['PaymentURL']}")
        return response['PaymentURL']
    else:
        print('Failed to initiate payment.')
        print('Error message:', response.get('Message') if response else 'None')
        return None
