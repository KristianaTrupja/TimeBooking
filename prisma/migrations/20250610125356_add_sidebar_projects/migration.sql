-- CreateTable
CREATE TABLE "SidebarProject" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectKey" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "SidebarProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SidebarProject_userId_month_year_idx" ON "SidebarProject"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "SidebarProject" ADD CONSTRAINT "SidebarProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
