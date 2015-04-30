#setwd("C:/Users/Jonathan/Google Drive/UW/Year 3 +/Data Visualization/HW3")
library(reshape2)
library(doParallel)

dist_country_table <- function(dat){
  
  districts <- unique(dat$District) # initialize vector of districts
  countries <- districts # initialize vector of countries
  
  # for each district, find the corresponding country and 
  for(s in 1:length(districts)){
    
    countries[s] <- unique(dat$Country[dat$District == districts[s]])
    
  }
  
  return(data.frame(district = districts, country = countries))
  
}


#### comp_foi calculates the force of infection as a function of the numbers of susceptibles and infecteds in that district, the number of infecteds in neigboring districts, and model parameters. 

## inputs:
# - dat: ebola dataset with variables for country, district, case type (confirmed or probable), week (date corresponding to beginning of the week), and case count
# - adjmat: adjacency matrix, ordered alphabetically
# - infectivity: parameter governing the infectivity
# - samp_prob: sampling probability, i.e. the fraction of total infecteds that were observed
# - neighbor_district: parameter for the multiplicative discount in weight that counts in neighboring districts receive 
# - neighbor_country: parameter for the additional multiplicative discount in weight that neighboring districts in different countries receive
# - recovery: number of weeks contributing to the current foi, including the current week. default is 3, so includes counts from the previous two weeks. 

## output: 
# - foi: vector containing the force of infection for each record for that week

comp_foi <- function(dat, popdat, adjmat, infectivity, samp_prob, neighbor_district, neighbor_country){
  
  # initialize foi
  
  foi <- rep(0, nrow(dat))
  
  # generate lookup table for countries to which each district belongs
  
  dist_country <- dist_country_table(dat)
  dist_country <- dist_country[order(dist_country$district),]
  
  # add the week number to the dataset
  
  dat$weeknum <- match(dat$Week, unique(dat$Week))
  
  # initialize the counts of susceptibles and infecteds
  dat$susceptible <- 0
  dat$infected <- 0
  
  # generate adjust counts for binomial sampling
  dat$Count <- round(dat$Count/samp_prob)
  
  # for each record, generate the counts of susceptibles and infecteds
  for(s in 1:nrow(dat)){
    
    if(dat$weeknum[s] == 1){
      
      dat$infected[s] <- dat$Count[s]
      dat$susceptible[s] <- popdat$Extrapolated[popdat$District == dat$District[s]] - dat$Count[s] # no recovereds, so susceptibles is popsize - infected
      
    } else if(dat$weeknum[s] == 2){
      
      dat$infected[s] <- dat$Count[s] + dat$infected[(dat$District == dat$District[s]) & (dat$Case_Type == dat$Case_Type[s]) & (dat$weeknum == 1)]
      dat$susceptible[s] <- popdat$Extrapolated[popdat$District == dat$District[s]] - dat$infected[s] # no recovereds, so susceptibles is popsize - infected      
      
    } else if(dat$weeknum[s] == 3){
      
      dat$infected[s] <- dat$Count[s] + dat$infected[(dat$District == dat$District[s]) & (dat$Case_Type == dat$Case_Type[s]) & (dat$weeknum == 2)]
      dat$susceptible[s] <- popdat$Extrapolated[popdat$District == dat$District[s]] - dat$infected[s] # no recovereds, so susceptibles is popsize - infected      
      
    } else if(dat$weeknum[s] > 3){
      
      dat$infected[s] <- dat$Count[s] + dat$infected[(dat$District == dat$District[s]) & (dat$Case_Type == dat$Case_Type[s]) & (dat$weeknum == (dat$weeknum[s]-1))] - dat$Count[(dat$District == dat$District[s]) & (dat$Case_Type == dat$Case_Type[s]) & (dat$weeknum == (dat$weeknum[s] - 3))]
      
      dat$susceptible[s] <- popdat$Extrapolated[popdat$District == dat$District[s]] - sum(dat$Count[(dat$District == dat$District[s]) & (dat$Case_Type == dat$Case_Type[s]) & (dat$weeknum <= dat$weeknum[s])])
      
    }
    
  }  
  
  # now calculate the foi
  
  foi[dat$weeknum == 1] <- 0 
  
  for(s in (sum(dat$weeknum == 1)+1):nrow(dat)){
    
    district <- dat$District[s] # get district
    country <- dist_country$country[dist_country$district == dat$District[s]] # get country
    weeknum <- dat$weeknum[s] # get week number
    casetype <- dat$Case_Type[s] # get case type
    popsize <- popdat$Extrapolated[popdat$District == district] # get population size
    
    infectedvec <- dat$infected[(dat$weeknum == (weeknum) ) & (dat$Case_Type == casetype)] # get count of infecteds in all districts
    
    adjacency_weight <- adjmat[rownames(adjmat) == district] # get adjacency row
    
    # weights for neighboring districts
    adjacency_weight[which(rownames(adjmat) != district), 1] <- adjacency_weight[which(rownames(adjmat) != district), 1] * neighbor_district #downweight neighbors
    adjacency_weight[which(dist_country$country != country), 1] <- adjacency_weight[which(dist_country$country != country), 1] * neighbor_country #downweight neighbors in different countries more
    
    foi[s] <- infectivity / popsize * sum(infectedvec * adjacency_weight) * dat$susceptible[s] # compute foi
    
  }
  
  return(foi)
  
}