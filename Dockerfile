FROM archlinux

COPY . /archion

WORKDIR /archion

RUN bash global-setup.sh

CMD ["bash"]
