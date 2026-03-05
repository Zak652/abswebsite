from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str = ""
    redirect_url: Optional[str] = None
    error: Optional[str] = None
    raw_response: dict = field(default_factory=dict)


class PaymentProvider(ABC):
    """Abstract base for all payment providers."""

    @abstractmethod
    def initiate(
        self,
        amount: float,
        currency: str,
        email: str,
        reference: str,
        description: str = "",
        redirect_url: str = "",
    ) -> PaymentResult:
        """Initiate a payment. Returns a redirect_url for hosted checkouts."""
        ...

    @abstractmethod
    def verify(self, transaction_id: str) -> PaymentResult:
        """Verify a payment by transaction ID or reference."""
        ...


class FlutterwaveProvider(PaymentProvider):
    """Flutterwave hosted checkout — existing implementation used for training payments."""

    def initiate(
        self, amount, currency, email, reference, description="", redirect_url=""
    ):
        import requests
        from django.conf import settings

        payload = {
            "tx_ref": reference,
            "amount": amount,
            "currency": currency,
            "redirect_url": redirect_url,
            "customer": {"email": email},
            "customizations": {
                "title": "ABS Platform",
                "description": description,
            },
        }
        try:
            resp = requests.post(
                "https://api.flutterwave.com/v3/payments",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            data = resp.json()
            if data.get("status") == "success":
                return PaymentResult(
                    success=True,
                    transaction_id=reference,
                    redirect_url=data["data"]["link"],
                    raw_response=data,
                )
            return PaymentResult(
                success=False,
                error=data.get("message", "Payment initiation failed"),
                raw_response=data,
            )
        except Exception as exc:
            return PaymentResult(success=False, error=str(exc))

    def verify(self, transaction_id):
        import requests
        from django.conf import settings

        try:
            resp = requests.get(
                f"https://api.flutterwave.com/v3/transactions/{transaction_id}/verify",
                headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
                timeout=10,
            )
            data = resp.json()
            success = (
                data.get("status") == "success"
                and data.get("data", {}).get("status") == "successful"
            )
            return PaymentResult(
                success=success,
                transaction_id=str(transaction_id),
                raw_response=data,
            )
        except Exception as exc:
            return PaymentResult(success=False, error=str(exc))


class StripeProvider(PaymentProvider):
    """Stripe card payments — international clients."""

    def initiate(
        self, amount, currency, email, reference, description="", redirect_url=""
    ):
        try:
            import stripe
            from django.conf import settings

            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": currency.lower(),
                            "product_data": {"name": description or "ABS Platform"},
                            "unit_amount": int(amount * 100),  # Stripe uses cents
                        },
                        "quantity": 1,
                    }
                ],
                mode="payment",
                customer_email=email,
                success_url=f"{redirect_url}?stripe_session={{CHECKOUT_SESSION_ID}}",
                cancel_url=redirect_url,
                metadata={"reference": reference},
            )
            return PaymentResult(
                success=True,
                transaction_id=session.id,
                redirect_url=session.url,
                raw_response={"session_id": session.id},
            )
        except Exception as exc:
            return PaymentResult(success=False, error=str(exc))

    def verify(self, transaction_id):
        try:
            import stripe
            from django.conf import settings

            stripe.api_key = settings.STRIPE_SECRET_KEY
            session = stripe.checkout.Session.retrieve(transaction_id)
            return PaymentResult(
                success=session.payment_status == "paid",
                transaction_id=session.id,
                raw_response={"payment_status": session.payment_status},
            )
        except Exception as exc:
            return PaymentResult(success=False, error=str(exc))


class MTNMoMoProvider(PaymentProvider):
    """MTN Mobile Money — Uganda/East Africa."""

    def initiate(
        self, amount, currency, email, reference, description="", redirect_url=""
    ):
        # MTN MoMo uses a callback model — initiate a request-to-pay and poll for status
        # Requires phone number, not just email; implementing as stub for Phase 2
        return PaymentResult(
            success=False,
            error="MTN MoMo: phone number required. Use the training registration form with phone field.",
        )

    def verify(self, transaction_id):
        try:
            import requests
            from django.conf import settings

            resp = requests.get(
                f"https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/{transaction_id}",
                headers={
                    "Authorization": f"Bearer {settings.MTN_MOMO_API_KEY}",
                    "X-Target-Environment": "sandbox",
                    "Ocp-Apim-Subscription-Key": settings.MTN_MOMO_SUBSCRIPTION_KEY,
                },
                timeout=10,
            )
            data = resp.json()
            return PaymentResult(
                success=data.get("status") == "SUCCESSFUL",
                transaction_id=transaction_id,
                raw_response=data,
            )
        except Exception as exc:
            return PaymentResult(success=False, error=str(exc))


class AirtelMoneyProvider(PaymentProvider):
    """Airtel Money — Uganda/East Africa."""

    def initiate(
        self, amount, currency, email, reference, description="", redirect_url=""
    ):
        return PaymentResult(
            success=False,
            error="Airtel Money: phone number required. Use the training registration form with phone field.",
        )

    def verify(self, transaction_id):
        # Airtel Money verification endpoint
        return PaymentResult(
            success=False,
            error="Airtel Money verification not yet configured.",
        )


# Provider routing map: (currency, method) -> provider class
_PROVIDER_MAP: dict[tuple[str, str], type[PaymentProvider]] = {
    ("USD", "card"): StripeProvider,
    ("USD", "flutterwave"): FlutterwaveProvider,
    ("KES", "card"): StripeProvider,
    ("KES", "flutterwave"): FlutterwaveProvider,
    ("UGX", "flutterwave"): FlutterwaveProvider,
    ("UGX", "mtn"): MTNMoMoProvider,
    ("UGX", "airtel"): AirtelMoneyProvider,
}


def get_payment_provider(currency: str, method: str = "flutterwave") -> PaymentProvider:
    """Return the correct payment provider instance for the given currency + method."""
    cls = _PROVIDER_MAP.get((currency.upper(), method.lower()), FlutterwaveProvider)
    return cls()
