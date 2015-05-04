a3-jinasuh-fintzij-amitmeir
===============

## Team Members

1. Jina Suh jinasuh@uw.edu
2. John Fintzi fintzij@uw.edu
3. Amit meir amitmeir@uw.edu

## 2014 Ebola Outbreak in West Africa

Understanding the geographic evolution of an epidemic is essential to developing effective strategies to control the spread of disease. Visualizing the influence of infections in neighboring districts is of particular interest since insights gleaned about disease migration across administrative and national borders critically inform the development of prophylactic policies to contain the epidemic. 

$$x^2$$

The force of infection (FoI) is a measure of the rate of disease transmission from infected individuals to susceptibles, normalized by population size. The FoI at time t can be understood as 

FoI(t)∝  (S_w (t)×(I_w (t)+ 〖α×I〗_ns (t)+γ×I_nd (t)))/(District population size)

where S_w (t) is the number of susceptible individuals within a district, I_w (t) is the current number of infected individuals within a district, I_ns (t) is the number infected in neighboring districts in the same country, I_nd (t) is the number infected in neighboring districts in different countries, and α and γ are parameters that down weight the contribution of infected counts in neighboring districts to the FoI. The number of susceptible individuals in a district was derived as the population size of the district minus the cumulative incidence to date. The current number of infected individuals was derived from the new case counts as a rolling sum over a three week period, including the current week. This window was chosen to reflect the average time until death or infection clearance for Ebola patients, which is between 1-2 weeks. The chosen window thus permits infections accrued at the end of the first week to be reflected in the FoI for the third week, though we acknowledge that this choice is likely to be an anti-conservative estimate of the true number of infected individuals. 

The map displays weekly snapshots of the FoI for each district in Sierra Leone, Guinea, and Liberia. Users may select districts to see a time series of the number of the new cases since the epidemic began in December 2013. The visualization is intended to highlight both the geographic spread of the epidemic, as well as aspects of the epidemic dynamics, such as the influence of districts with outbreaks on neighboring districts. An important capability built into this tool is the ability to view time series of new case counts for a selected cluster of districts. This enables users to flexibly explore spatial and temporal outbreak patterns according to groupings that they determine.

One example of using this visualization would be to explore whether the cases in neighboring districts exert infection pressure on susceptible individuals in a given district. We can investigate this by moving the time slider to the time just prior to the first recorded in a district, noting that the force of infection is non-zero for all but the earliest districts where infections were recorded. This reflects the contribution to the force of infection from cases in neighboring districts. We can also identify clusters of districts that are highly correlated by playing through the epidemic and looking for clusters of districts that light up concurrently

## Running Instructions
Easy!
http://cse512-15s.github.io/a3-jinasuh-fintzij-amitmeir/

## Story Board
Link to story board/sketchbook: 
https://drive.google.com/file/d/0BzHxgs4ueow-ZW1Wc24zUURGaFU/view?usp=sharing
