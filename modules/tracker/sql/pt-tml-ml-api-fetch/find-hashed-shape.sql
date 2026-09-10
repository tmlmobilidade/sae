SELECT
	shape_polyline
FROM (
	SELECT *
	FROM operation.hashed_shapes
	WHERE _id = $hashed_shape_id
	ORDER BY updated_at DESC
	LIMIT 1 BY _id
)
