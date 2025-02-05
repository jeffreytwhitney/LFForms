CREATE VIEW [dbo].[qryQualityEngineers]
AS
SELECT        TOP (100) PERCENT SiteID, DepartmentID, FName, LName, LName + N', ' + FName AS ManufacturingEngineerName, ID
FROM            dbo.tblUser
WHERE        (IsActive = 1) AND (UserTypeID = 3)
ORDER BY LName