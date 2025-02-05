

CREATE FUNCTION [dbo].[fnGetSiteOwnerEmailAddress]
(
	@site_id INT
)
RETURNS varchar(255)
AS
BEGIN
	Declare @site_owner_email_address varchar(255) = (SELECT EmailAddressCCList 
																						 FROM tblSite 
																						 WHERE tblSite.ID = @site_id)
	
	RETURN @site_owner_email_address
END