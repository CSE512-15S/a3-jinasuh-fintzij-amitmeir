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

# Create dataset ----------------------------------------------------------

require(snowfall)
computation.wrapper <- function(config,dat,popdat,adjmat) {
  infectivity <- config[[1]]
  samp_prob <- config[[2]]
  neighbor_district <- config[[3]]
  neighbor_country <- config[[4]]
  
  results <- comp_foi(dat = eboladat, popdat = popdat, adjmat = adjmat, infectivity, samp_prob, neighbor_district, neighbor_country)
}

infectivity_seq <- 1
samp_prob <- 1
neighbor_district <- 0.05
neighbor_country <- 0.05

param_combns <- expand.grid(infectivity_seq, samp_prob, neighbor_district, neighbor_country)

#sfInit(paralle=TRUE,cpus=3)
#sfSource("ebola functions.R")
foi_mat <- apply(param_combns,1,computation.wrapper,dat=eboladat,popdat=popdat,adjmat=adjmat)
#sfStop()

#backup
#save(foi_mat,file="foi matrix full.Robj")

#separating confirmed and probable in ebola dat set 
eboladat <- eboladat[,-1]
confirmed.index <- which(eboladat$Case_Type==" Confirmed")
probable.index <- which(eboladat$Case_Type==" Probable")
data.confirmed <- eboladat[confirmed.index,5]
eboladat <- cbind(eboladat[probable.index,],data.confirmed)
names(eboladat)[5:6] <- c("Probable","Confirmed")
eboladat <- eboladat[,-3]

#seperating confirmed and probable in foi
confirmed.foi <- foi_mat[confirmed.index,]
probable.foi <- foi_mat[probable.index,]
names(confirmed.foi) <- paste(names(confirmed.foi),"confirmed",sep="")
names(probable.foi) <- paste(names(probable.foi),"probable",sep="")
foi_mat <- cbind(confirmed.foi,probable.foi)
rm(confirmed.foi,probable.foi)
final_data <- cbind(eboladat,foi_mat)

#Deleting spaces and apostrophies
final_data$DistrictID <- sapply(final_data$District,function(str) gsub(" ","",str))
final_data$DistrictID <- sapply(final_data$DistrictID,function(str) gsub("'","",str))
names(final_data)[2] <- "District_Name"

#Adding Week_ID
final_data$WeekID <- sapply(final_data$Week,function(str) which(weeks==str))-1

#log transforming foi
final_data[,6:7] <- apply(final_data[,6:7],2,function(x) log(x+1))

#Adding comulative sum of cases
probableCumSum <- numeric(nrow(final_data))
confirmedCumSum <- numeric(nrow(final_data))
for(district in unique(final_data$District)) {
  districtIndex <- which(final_data$District==district)
  probableCumSum[districtIndex] <- cumsum(final_data$Probable[districtIndex])
  confirmedCumSum[districtIndex] <- cumsum(final_data$Confirmed[districtIndex])
}

final_data <- cbind(final_data,probable_cumulative=probableCumSum,confirmed_cumulative=confirmedCumSum)

#Chaging variables names to fit web implementation
names(final_data)[8] <- "DistrictID"
names(final_data)[7] <- "ProbableFOI"
names(final_data)[6] <- "ConfirmedFOI"
names(final_data)[10] <- "ProbableCumulative"
names(final_data)[11] <- "ConfirmedCumulative"
names(final_data)[2] <- "DistrictName"

#Adding population sizes to each row
#checking match between popdat names and final_data names
sum(sapply(popdat[,1],function(str) str %in% final_data$District_Name))
final_data$PopulationSize <- sapply(final_data$DistrictName,function(str) popdat[which(str==popdat[,1]),3])


write.csv(final_data, file = "EbolaDataFoi.csv")
