CREATE VIEW [dbo].[qryAllUsers]
AS
SELECT    TOP 100 percent     tblUser.ID, UserTypeID, tblUser.SiteID, DepartmentID, tblUser.EmployeeNumber, tblUser.EMailAddress, tblUser.NetworkUserName, tblUser.IsAdmin, tblUser.IsActive, tblUser.FName, tblUser.LName, tblUser.LName + N', ' + tblUser.FName AS EmployeeName
FROM            tblUser