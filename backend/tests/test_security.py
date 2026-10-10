from app.core.security import hash_password, verify_password


def test_verify_password_rejects_invalid_and_unsupported_hashes():
    valid_hash = hash_password("correct password")

    assert verify_password("correct password", valid_hash)
    assert not verify_password("wrong password", valid_hash)
    assert not verify_password("any password", "unsupported-or-corrupt-hash")
