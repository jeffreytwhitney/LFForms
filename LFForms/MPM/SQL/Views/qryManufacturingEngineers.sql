CREATE VIEW [dbo].[qryManufacturingEngineers]
AS
SELECT        TOP (100) PERCENT SiteID, DepartmentID, FName, LName, FName + N' ' + LName AS ManufacturingEngineerName, ID
FROM            dbo.tblUser
WHERE        (IsActive = 1) AND (UserTypeID = 4)
ORDER BY LName