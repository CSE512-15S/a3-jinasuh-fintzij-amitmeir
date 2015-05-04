a3-jinasuh-fintzij-amitmeir
===============

## Team Members

1. Jina Suh jinasuh@uw.edu
2. Jonathan Fintzi fintzij@uw.edu
3. Amit meir amitmeir@uw.edu

## 2014 Ebola Outbreak in West Africa

Understanding the geographic evolution of an epidemic is essential to developing effective strategies to control the spread of disease. Visualizing the influence of infections in neighboring districts is of particular interest since insights gleaned about disease migration across administrative and national borders critically inform the development of prophylactic policies to contain the epidemic. 

The force of infection (FoI) is a measure of the rate of disease transmission from infected individuals to susceptibles, normalized by population size. The FoI at time t can be understood as 

FoI(t)∝  (S_w (t)×(I_w (t)+ 〖α×I〗_ns (t)+γ×I_nd (t)))/(District population size)

where S_w (t) is the number of susceptible individuals within a district, I_w (t) is the current number of infected individuals within a district, I_ns (t) is the number infected in neighboring districts in the same country, I_nd (t) is the number infected in neighboring districts in different countries, and α and γ are parameters that down weight the contribution of infected counts in neighboring districts to the FoI. The number of susceptible individuals in a district was derived as the population size of the district minus the cumulative incidence to date. The current number of infected individuals was derived from the new case counts as a rolling sum over a three week period, including the current week. This window was chosen to reflect the average time until death or infection clearance for Ebola patients, which is between 1-2 weeks. The chosen window thus permits infections accrued at the end of the first week to be reflected in the FoI for the third week, though we acknowledge that this choice is likely to be an anti-conservative estimate of the true number of infected individuals. 

The map displays weekly snapshots of the FoI for each district in Sierra Leone, Guinea, and Liberia. Users may select districts to see a time series of the number of the new cases since the epidemic began in December 2013. The visualization is intended to highlight both the geographic spread of the epidemic, as well as aspects of the epidemic dynamics, such as the influence of districts with outbreaks on neighboring districts. An important capability built into this tool is the ability to view time series of new case counts for a selected cluster of districts. This enables users to flexibly explore spatial and temporal outbreak patterns according to groupings that they determine.

One example of using this visualization would be to explore whether the cases in neighboring districts exert infection pressure on susceptible individuals in a given district. We can investigate this by moving the time slider to the time just prior to the first recorded in a district, noting that the force of infection is non-zero for all but the earliest districts where infections were recorded. This reflects the contribution to the force of infection from cases in neighboring districts. We can also identify clusters of districts that are highly correlated by playing through the epidemic and looking for clusters of districts that light up concurrently

## Running Instructions
Start and pause the animation of the epidemic using either play button on the top right or bottom left corner. One or several districts may be selected in order to display the time series of new case counts. The slider underneath the time series graph can be used to move forward or backward in time. 
http://cse512-15s.github.io/a3-jinasuh-fintzij-amitmeir/

## Story Board
Link to story board/sketchbook: 
https://drive.google.com/file/d/0BzHxgs4ueow-ZW1Wc24zUURGaFU/view?usp=sharing

The initial concept for the visualization was to create a model-building tool that would enable investigators to explore the influence different parameter values on a general stochastic epidemic model for the 2014 ebola outbreak. The motivation was to allow the user to play with parameters in order to visually find values that generated visualizations that correspond to the outbreak data. It was quickly realized that this would fail for two reasons. First, the tool would be severely limited by the scientific framework that we imposed in designing it. Second, the visualization would display contrasts that have to do with the structure of the data rather than with actual predictions based on parameter settings. Therefore, the particular values specified by parameters would not be inherently meaningful. 

Rather than focus on a modeling tool, we decided to shift our objective to building a tool for exploration of the dataset. The two major challenges from a scientific perspective were (1) generating a scientifically meaningful framework that is also intuitive for the user, and (2) maintaining a sufficient level of abstraction in order to make visualization tractable, while still incorporating key aspects of epidemic dynamics. In particular, we felt that it was important to emphasize both the spatial and temporal spread of the epidemic, and the spatial network structure of the epidemic dynamics. A key aspect of this was allowing the user to connect the count data to an epidemiologically relevant notion of force of infection. This was accomplished by mapping the force of infection and allowing the user to peek at the data by selecting districts for which to display counts. One of the challenges that needed to be overcome was to make the relationship between the force of infection and the case counts clear to the user. This was achieved by including an explanation for force of infection in one of the quadrants of the visualization. Many of the design choices, such as layout and colour choices, followed naturally from the subject matter and decisions regarding what information we wanted to convey. 

## Development process
