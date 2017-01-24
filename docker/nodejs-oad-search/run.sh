#!/bin/bash
sudo docker run -it --name c-nodejs-oad-search -v `pwd`/../..:/opt/oad-search -d openstate/nodejs-oad-search
