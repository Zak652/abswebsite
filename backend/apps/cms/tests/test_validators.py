"""Tests for CMS publish validators."""

import pytest

from apps.cms.validators import validate_for_publish, PublishValidationError
from apps.cms.tests.factories import (
    CaseStudyFactory,
    HeroSectionFactory,
    PageMetaFactory,
    PricingPlanFactory,
    ServiceOfferingFactory,
)


class TestHeroSectionValidation:
    def test_valid_hero_passes(self, db):
        hero = HeroSectionFactory(
            headline="Hello",
            cta_primary_text="CTA",
            cta_primary_link="/go",
        )
        validate_for_publish(hero)  # should not raise

    def test_missing_headline_fails(self, db):
        hero = HeroSectionFactory(
            headline="", cta_primary_text="CTA", cta_primary_link="/go"
        )
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(hero)
        assert "headline" in exc_info.value.errors

    def test_missing_cta_text_fails(self, db):
        hero = HeroSectionFactory(
            headline="Hello", cta_primary_text="", cta_primary_link="/go"
        )
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(hero)
        assert "cta_primary_text" in exc_info.value.errors

    def test_missing_cta_link_fails(self, db):
        hero = HeroSectionFactory(
            headline="Hello", cta_primary_text="CTA", cta_primary_link=""
        )
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(hero)
        assert "cta_primary_link" in exc_info.value.errors

    def test_multiple_missing_fields(self, db):
        hero = HeroSectionFactory(headline="", cta_primary_text="", cta_primary_link="")
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(hero)
        assert len(exc_info.value.errors) == 3


class TestServiceOfferingValidation:
    def test_valid_service_passes(self, db):
        svc = ServiceOfferingFactory()
        validate_for_publish(svc)

    def test_missing_problem_fails(self, db):
        svc = ServiceOfferingFactory(problem="")
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(svc)
        assert "problem" in exc_info.value.errors

    def test_empty_deliverables_fails(self, db):
        svc = ServiceOfferingFactory(deliverables=[])
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(svc)
        assert "deliverables" in exc_info.value.errors


class TestCaseStudyValidation:
    def test_valid_case_study_passes(self, db):
        cs = CaseStudyFactory()
        validate_for_publish(cs)

    def test_missing_challenge_fails(self, db):
        cs = CaseStudyFactory(challenge="")
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(cs)
        assert "challenge" in exc_info.value.errors

    def test_empty_results_fails(self, db):
        cs = CaseStudyFactory(results=[])
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(cs)
        assert "results" in exc_info.value.errors


class TestPricingPlanValidation:
    def test_valid_plan_passes(self, db):
        plan = PricingPlanFactory(price_usd=99)
        validate_for_publish(plan)

    def test_zero_price_fails(self, db):
        plan = PricingPlanFactory(price_usd=0)
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(plan)
        assert "price_usd" in exc_info.value.errors

    def test_negative_price_fails(self, db):
        plan = PricingPlanFactory(price_usd=-10)
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(plan)
        assert "price_usd" in exc_info.value.errors


class TestPageMetaValidation:
    def test_valid_meta_passes(self, db):
        meta = PageMetaFactory(title="Short Title", description="A brief description.")
        validate_for_publish(meta)

    def test_title_too_long_fails(self, db):
        from apps.cms.models import PageMeta

        # Build in memory — don't save to DB since max_length=60 at DB level
        meta = PageMeta(route="/test-long", title="A" * 61, description="OK")
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(meta)
        assert "title" in exc_info.value.errors

    def test_description_too_long_fails(self, db):
        from apps.cms.models import PageMeta

        meta = PageMeta(route="/test-long-desc", title="OK", description="A" * 161)
        with pytest.raises(PublishValidationError) as exc_info:
            validate_for_publish(meta)
        assert "description" in exc_info.value.errors
