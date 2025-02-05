CREATE FUNCTION [dbo].fnHTMLizeText
(
	@text_to_HTMLize VARCHAR(MAX)
)
RETURNS VARCHAR(MAX)
AS
BEGIN
	SET @text_to_HTMLize = REPLACE(@text_to_HTMLize, CHAR(13), '<br>')
	SET @text_to_HTMLize = REPLACE(@text_to_HTMLize, CHAR(10), '')
	RETURN IsNull(@text_to_HTMLize, '')
	
END