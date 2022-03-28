#!/bin/bash

service nginx stop
nginx -g "daemon off;" &
service nginx start
bash
