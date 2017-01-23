#!/bin/bash
sudo docker run -it --name c-nodejs-oad-search -p 3000:3000 -v `pwd`/../..:/opt/oad-search -d openstate/nodejs-oad-search
