# Generate dataset --------------------------------------------------------
library(reshape2)
library(doParallel)
require(snowfall)

# reshape data to long format
#eboladat <- read.csv("EbolaData_corrected.csv", header = TRUE, stringsAsFactors = FALSE)
#eboladat[is.na(eboladat)] <- 0 # replace missing values with zero counts

# melt, then relable variables
#eboladat <- melt(eboladat, id.vars <- c("Country", "Location", "Ebola.data.source", "Indicator.type", "Case.definition"))
#names(eboladat)[2:7] <- c("District", "Data source", "Indicator type", "Case_Type", "Week", "Count")

# # correct coding for dates
# eboladat$Week <- substring(eboladat$Week, 2)
# eboladat$Week <- as.Date(eboladat$Week, format = "%m.%d.%Y")
# 
# # remove patient database
# eboladat <- eboladat[eboladat[,3] != " Situation report", ]
# 
# eboladat <- eboladat[,-c(3,4)]
# #Turning probable into proable + count
# for(i in seq(from=2,to=nrow(eboladat),by=2)) {
#   eboladat$Count[i] <- eboladat$Count[i] + eboladat$Count[i-1]
# }

# 
# write csv
eboladat <- read.csv("EbolaData_corrected.csv", header = TRUE, stringsAsFactors = FALSE)

# process the adjacency matrix
adjmat <- read.csv("ebolaadjacency.csv", header = TRUE, stringsAsFactors = TRUE)
rownames(adjmat) <- adjmat[,1]; adjmat <- adjmat[,-1] # first column contains row names. set it and remove the column. 
adjmat[is.na(adjmat)] <- 0

adjmat <- adjmat + t(adjmat) - diag(1, nrow(adjmat))# reflect adjacency matrix so it is not lower triangular

write.csv(adjmat, file = "adjmat.csv")

# load the population size matrix
popdat <- read.csv("popdata.csv", header=TRUE, stringsAsFactors = FALSE)

#separating confirmed and probable in ebola dat set 
eboladat <- eboladat[,-1]
confirmed.index <- which(eboladat$Case_Type==" Confirmed")
probable.index <- which(eboladat$Case_Type==" Probable")
data.confirmed <- eboladat[confirmed.index,5]
eboladat <- cbind(eboladat[probable.index,],data.confirmed)
names(eboladat)[5:6] <- c("Probable","Confirmed")
eboladat <- eboladat[,-3]

#Computing FOI
system.time(FOI <- new.comp.foi(eboladat,popdat,adjmat,districtWeight=0.015,countryWeight=0.0075))

#seperating confirmed and probable in foi
final_data <- cbind(eboladat,log(FOI+1))

#Deleting spaces and apostrophies
final_data$DistrictID <- sapply(final_data$District,function(str) gsub(" ","",str))
final_data$DistrictID <- sapply(final_data$DistrictID,function(str) gsub("'","",str))
names(final_data)[2] <- "DistrictName"

#Adding Week_ID
final_data$WeekID <- sapply(final_data$Week,function(str) which(weeks==str))-1

#Adding comulative sum of cases
probableCumSum <- numeric(nrow(final_data))
confirmedCumSum <- numeric(nrow(final_data))
for(district in unique(final_data$DistrictID)) {
  districtIndex <- which(final_data$DistrictID==district)
  probableCumSum[districtIndex] <- cumsum(final_data$Probable[districtIndex])
  confirmedCumSum[districtIndex] <- cumsum(final_data$Confirmed[districtIndex])
}

final_data <- cbind(final_data,ProbableComulative=probableCumSum,ConfirmedComulative=confirmedCumSum)

#Adding population sizes to each row
#checking match between popdat names and final_data names
sum(sapply(popdat[,1],function(str) str %in% final_data$DistrictName))
final_data$PopulationSize <- sapply(final_data$DistrictName,function(str) popdat[which(str==popdat[,1]),3])

write.csv(final_data, file = "EbolaDataFoiCorrect.csv")


# Global View Data Set ------------------------------
#Compress data by week
globalDat <- final_data[,c(3,4,5,9,12)]
Probable <- tapply(globalDat[,2],INDEX=globalDat$WeekID,function(x) sum(x))
Confirmed <- tapply(globalDat[,3],INDEX=globalDat$WeekID,function(x) sum(x))
PopulationSize <- tapply(globalDat[,5],INDEX=globalDat$WeekID,function(x) sum(x))

compute.FOI <- function(counts,population) {
  susceptible <- counts
  
  infected <- counts 
  for(i in 2:length(counts)) {
    infected[i] <- sum(counts[i:max(1,i-2)])
  }
  
  susceptible <- counts
  countSum <- cumsum(counts)
  for(i in 1:length(counts)) {
    susceptible[i] <- population[i] - countSum[i]
  }
  
  FOI <- as.numeric(infected)*as.numeric(susceptible)/as.numeric(population)
  #FOI <- log(1+FOI)
  return(data.frame(FOI=FOI,cumsum=countSum))
}

# par(mar = c(5, 4, 4, 4) + 0.3)  # Leave space for z axis
# plot(FOI,type="l",col="red")
# par(new = TRUE)
# plot(countSum, type = "l", axes = FALSE, bty = "n", xlab = "", ylab = "")

ProbableFOI <- compute.FOI(Probable,PopulationSize)
ConfirmedFOI <- compute.FOI(Confirmed,PopulationSize)

globalDat <- data.frame(Week=unique(globalDat$Week),
                        ProbableFOI=ProbableFOI$FOI,
                        ConfirmedFOI=ConfirmedFOI$FOI,
                        ProbableCumsum=ProbableFOI$cumsum,
                        ConfirmedCumsum=ConfirmedFOI$cumsum,
                        WeekID=0:(length(Probable)-1))

write.csv(globalDat,file="globalFOI.csv")


