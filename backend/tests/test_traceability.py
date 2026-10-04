import pytest
from app.services.traceability_service import extract_issue_ids

def test_extract_issue_ids():
    assert extract_issue_ids("Fixes #123") == {123}
    assert extract_issue_ids("Merge branch 'issue-456'") == {456}
    assert extract_issue_ids("No issue here") == set()
    # Should not match #1234 when looking for 123 (implicitly checked by extract logic)
    assert extract_issue_ids("Fixes #1234") == {1234}
    # Test strict boundaries
    assert extract_issue_ids("foo#123bar") == set() # not matched due to boundaries
    assert extract_issue_ids("issue-1234") == {1234}
    assert extract_issue_ids("some text #12 some more") == {12}
    
    # Wait, the instruction says: Issue #12 must not accidentally match Issue #123.
    # Our regex captures the number. We should verify it does not falsely extract 12 from #123.
    # Since re.findall gives ['123'], we get {123}, NOT {12, 123}.
    assert extract_issue_ids("#123") == {123}

