
CREATE FUNCTION [dbo].fnSanitizeText
(
	@input_text varchar(max)
)
RETURNS varchar(max)
AS
BEGIN
	SET @input_text = REPLACE(@input_text, '"', '');
	SET @input_text = REPLACE(@input_text, '''', '');
	SET @input_text = TRIM(@input_text);
	RETURN @input_text;



END