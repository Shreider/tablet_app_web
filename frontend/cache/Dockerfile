FROM node:22-alpine
WORKDIR /app
RUN mkdir -p /data && chown node:node /data
COPY --chown=node:node cache/*.mjs ./cache/
COPY --chown=node:node shared/roomSchedule.mjs ./shared/
# The entrypoint prepares the host directory, then drops root before starting HTTP.
ENV CACHE_DIR=/data PORT=3002
EXPOSE 3002
CMD ["node", "cache/entrypoint.mjs"]
