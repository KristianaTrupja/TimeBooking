-- CreateTable
CREATE TABLE "Projects" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "project" TEXT NOT NULL,

    CONSTRAINT "Projects_pkey" PRIMARY KEY ("id")
);
