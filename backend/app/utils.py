def flatten_metadata(metadata):
    return {
        key: str(value) if isinstance(value, dict) else value
        for key, value in metadata.items()
    }
