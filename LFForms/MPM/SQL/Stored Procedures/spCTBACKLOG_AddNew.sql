CREATE PROCEDURE spCTBACKLOG_AddNew
    @SiteID INT,
    @CTTicketNumber VARCHAR(50),
    @CTPartNumber VARCHAR(500),
    @NumberOfParts INT,
    @PerPartScanTime INT,
    @CTTicketDetails VARCHAR(2000),
    @InitiatorID INT,
    @DepartmentID INT,
    @StatusID INT,
    @DueDate DATE,
    @UpdatedBy VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.tblCTBacklog
    (
        SiteID,
        CTTicketNumber,
        CTPartNumber,
        NumberOfParts,
        PerPartScanTime,
        CTTicketDetails,
        InitiatorID,
        DepartmentID,
        StatusID,
        DueDate,
        UpdatedBy
    )
    VALUES
    (
        @SiteID,
        @CTTicketNumber,
        @CTPartNumber,
        @NumberOfParts,
        @PerPartScanTime,
        @CTTicketDetails,
        @InitiatorID,
        @DepartmentID,
        @StatusID,
        @DueDate,
        @UpdatedBy
    );

    -- Return the newly inserted ID
    SELECT CAST(SCOPE_IDENTITY() AS INT) AS ID;
END
GO

