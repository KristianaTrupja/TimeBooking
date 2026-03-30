-- CreateTable
CREATE TABLE "Holidays" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "holiday" TEXT NOT NULL,

    CONSTRAINT "Holidays_pkey" PRIMARY KEY ("id")
);
