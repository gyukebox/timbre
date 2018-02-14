/* eslint-disable camelcase */
const duration = require('mp3-duration');
const database = require('../models/database');
const recruitModel = require('../models/recruit/recruit');
const paragraphModel = require('../models/recruit/paragraph');
const versionModel = require('../models/recruit/version/version');
const recordingModel = require('../models/recruit/version/recording/recording');
const feedbackModel = require('../models/recruit/version/recording/feedback');
const { isBlank, isValidPageParameters, isScriptsReadableForActor } = require('../validation/validation');

exports.getRecruitList = (req, res) => {
  const { from, size } = req.params;

  if (isValidPageParameters(from, size) === false) {
    res.status(412).json({
      message: '파라미터가 부적합합니다.',
    });
    return;
  }

  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = from === undefined ? 0 : Number(from);
  const limit = size === undefined ? 50 : Number(size);

  recruitModel
    .findAndCountAll({
      where: { active: true },
      attributes,
      order,
      offset,
      limit,
    })
    .then((retrieved) => {
      const total = retrieved.count;
      const response = {
        pages: {
          total,
          from: offset,
          size: retrieved.rows.length,
          has_next: (total > offset + limit),
        },
        recruits: retrieved.rows,
      };
      res.json(response);
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 목록 조회에 실패했습니다.',
      });
    });
};

exports.searchRecruits = (req, res) => {
  const { from, size, query } = req.query;

  const attributes = [
    'recruit_id', 'title', 'amount', 'created_at',
    'category', 'mood', 'recruit_due_date', 'process_due_date',
    'bid_count', 'state', 'client_id', 'client_name',
  ];
  const order = [['recruit_id', 'DESC']];
  const offset = from === undefined ? 0 : Number(from);
  const limit = size === undefined ? 50 : Number(size);

  recruitModel
    .findAndCountAll({
      where: {
        query,
      },
      attributes,
      order,
      offset,
      limit,
    })
    .then((retrieved) => {
      const total = retrieved.count;
      const response = {
        pages: {
          total,
          from: offset,
          size: retrieved.rows.length,
          has_next: (total > offset + limit),
        },
        recruits: retrieved.rows,
      };
      res.json(response);
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 목록 조회에 실패했습니다.',
      });
    });
};

exports.getRecruitDetail = (req, res) => {
  recruitModel
    .findOne({
      where: { recruit_id: req.params.id },
      attributes: [
        'recruit_id', 'title', 'amount', 'created_at',
        'category', 'mood', 'recruit_due_date', 'process_due_date',
        'bid_count', 'state', 'client_id', 'client_name',
      ],
    })
    .then((retrieved) => {
      if (retrieved === null) {
        res.status(404).json({
          message: '구인 정보를 찾지 못했습니다.',
        });
      } else {
        res.json(retrieved);
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 정보 조회에 실패했습니다.',
      });
    });
};

exports.getRecruitBody = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
    return;
  }

  const { userId } = req.session.user;
  const { id } = req.params;

  recruitModel
    .findOne({
      where: { recruit_id: id },
      attributes: ['client_id', 'actor_id'],
    })
    .then((retrieved) => {
      if (retrieved.client_id === userId || (retrieved.actor_id === userId && isScriptsReadableForActor(retrieved.state))) {
        const response = {
          message: '구인 상세 정보 조회에 성공했습니다.',
          paragraphs: [],
        };

        paragraphModel
          .findAll({
            where: { recruitId: id },
          })
          .then((paragraphs) => {
            response.paragraphs = paragraphs;
            res.json(response);
          })
          .catch(() => {
            res.status(400).json({
              message: '구인 상세 정보 조회에 실패했습니다.',
            });
          });
      } else {
        res.status(403).json({
          message: '채택된 성우와 요청자만 볼 수 있습니다.',
        });
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 상세 정보 조회에 실패했습니다.',
      });
    });
};

exports.getRecruitSample = (req, res) => {
  recruitModel
    .findOne({
      where: { recruit_id: req.params.id },
      attributes: ['sample'],
    })
    .then((retrieved) => {
      if (retrieved === null) {
        res.status(404).json({
          message: '구인 정보를 찾지 못했습니다.',
        });
      } else {
        res.json({
          message: '구인 상세 정보 조회에 성공했습니다.',
          sample: retrieved.sample,
        });
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '구인 상세 정보 조회에 실패했습니다.',
      });
    });
};

exports.createRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 작성할 수 있습니다.',
    });
  } else if (req.session.user.type !== 'CLIENT') {
    res.status(403).json({
      message: '성우는 구인 정보를 작성할 수 없습니다.',
    });
  } else {
    const recruitDueDate = Date.now() + (1000 * 60 * 60 * 24 * req.body.recruit_duration);
    const processDueDate = recruitDueDate + (1000 * 60 * 60 * 24 * req.body.process_duration);
    const {
      title, description, category, mood, amount, sample, script,
    } = req.body;

    const paragraphs = script.split('\n\n');
    const paragraphAttributes = paragraphs.map((paragraph, index) => ({
      paragraphNumber: index + 1,
      content: paragraph,
    }));

    for (let i = 0; i < paragraphAttributes.length; i++) {
      if (paragraphAttributes[i].content.length > 8000) {
        res.status(412).json({
          message: '로그인한 사용자만 작성할 수 있습니다.',
        });
        return;
      }
    }

    // 검증
    if (!Number.isInteger(amount) || Number(amount) <= 0 ||
        isBlank(title) || title.length > 150 || isBlank(description) || title.length > 1000 ||
        isBlank(sample) || sample.length > 1000 || isBlank(script) || script.length > 8000) {
      res.status(412).json({
        message: '파라미터가 부적합합니다.',
      });

      return;
    }

    const recruitAttributes = {
      clientId: req.session.user.userId,
      clientName: req.session.user.name,
      title,
      description,
      category,
      mood,
      amount: Number(amount) * 10000,
      processDueDate,
      recruitDueDate,
      sample,
    };

    database
      .transaction()
      .then((transaction) => {
        recruitModel
          .create(recruitAttributes, { transaction })
          .then((created) => {
            for (let i = 0; i < paragraphAttributes.length; i++) {
              paragraphAttributes[i].recruitId = created.recruitId;
            }
            paragraphModel
              .bulkCreate(paragraphAttributes, { transaction })
              .then(() => {
                transaction.commit();

                res.status(201).json({
                  message: '구인 정보 추가에 성공했습니다.',
                  detail: created,
                });
              })
              .catch(() => {
                transaction.rollback();
                res.status(400).json({
                  message: '구인 정보 추가에 실패했습니다.',
                });
              });
          })
          .catch(() => {
            transaction.rollback();
            res.status(400).json({
              message: '구인 정보 추가에 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '구인 정보 추가에 실패했습니다.',
        });
      });
  }
};

exports.cancelRecruit = (req, res) => {
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 취소할 수 있습니다.',
    });
  } else if (req.session.user.type !== 'ACTOR') {
    res.status(403).json({
      message: '구인에 참여한 성우만 취소할 수 있습니다.',
    });
  } else {
    database
      .transaction()
      .then((transaction) => {
        recruitModel
          .findOne({
            where: { recruit_id: req.params.id },
          })
          .then((retrieved) => {
            const cannotCancelState = ['WAIT_FEEDBACK', 'ON_WITHDRAW', 'DONE', 'CANCELLED'];
            if (retrieved.actor_id !== req.session.user.userId) {
              transaction.rollback();
              res.status(403).json({
                message: '구인에 참여한 성우만 취소할 수 있습니다.',
              });
            } else if (cannotCancelState.indexOf(retrieved.state) !== -1) {
              transaction.rollback();
              res.status(400).json({
                message: '요청을 취소할 수 없는 상태입니다.',
              });
            } else {
              retrieved
                .update({
                  state: 'CANCELLED',
                  active: false,
                }, { transaction })
                .then(() => {
                  transaction.commit();
                  res.status(204).send();
                })
                .catch(() => {
                  transaction.rollback();
                  res.status(400).json({
                    message: '구인 취소에 실패했습니다.',
                  });
                });
            }
          })
          .catch(() => {
            transaction.rollback();
            res.status(400).json({
              message: '구인 취소에 실패했습니다.',
            });
          });
      })
      .catch(() => {
        res.status(400).json({
          message: '구인 취소에 실패했습니다.',
        });
      });
  }
};

exports.getAllVersions = (req, res) => {
  const { id } = req.params;
  recruitModel
    .findOne({
      where: {
        recruitId: id,
      },
    })
    .then((recruit) => {
      if (!recruit) {
        res.status(404).json({
          message: '구인 내용을 찾을 수 없습니다.',
        });
      } else {
        const response = [];
        for (let i = 0; i < recruit.currentVersion; i++) {
          response.push({
            version: i + 1,
            latest: recruit.currentVersion === i + 1,
          });
        }
        res.json(response);
      }
    })
    .catch(() => {
      res.status(400).json({
        message: '버전 조회에 실패했습니다.',
      });
    });
};

exports.getCurrentVersion = (req, res) => {
  const { id } = req.params;

  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: id,
        },
      })
      .then((recruit) => {
        if (!recruit) {
          res.status(404).json({
            message: '구인 내용을 찾을 수 없습니다.',
          });
        } else if (recruit.clientId === userId || recruit.actorId === userId) {
          const attributes = ['recruit_id', 'paragraph_number', 'content'];
          paragraphModel
            .findAll({
              attributes,
              where: {
                recruitId: id,
              },
            })
            .then((paragraphs) => {
              if (!paragraphs) {
                res.status(400).json({
                  message: '버전 조회에 실패했습니다.',
                });
              } else {
                versionModel
                  .findOne({
                    where: {
                      recruitId: id,
                      version: recruit.currentVersion,
                    },
                  })
                  .then((version) => {
                    // TODO : paragraph 데이터 가공 과정 구현 - 피드백 추가
                    res.json({
                      version: {
                        version: version.version,
                        created: version.createdAt,
                        paragraphs,
                        client: {
                          clientId: recruit.clientId,
                          username: recruit.clientName,
                        },
                      },
                    });
                  })
                  .catch(() => {
                    res.status(400).json({
                      message: '버전 조회에 실패했습니다.',
                    });
                  });
              }
            })
            .catch(() => {
              res.status(400).json({
                message: '버전 조회에 실패했습니다.',
              });
            });
        } else {
          res.status(403).json({
            message: '요청자와 성우만 접근 가능합니다.',
          });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '버전 조회에 실패했습니다.',
        });
      });
  }
};

exports.getParagraphFile = (req, res) => {
  const { recruit_id, version_no, paragraph_no } = req.params;
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: recruit_id,
        },
      })
      .then((recruit) => {
        if (!recruit) {
          res.status(404).json({
            message: '구인 내용을 찾을 수 없습니다.',
          });
        } else if (recruit.clientId === userId || recruit.actorId === userId) {
          recordingModel
            .findOne({
              where: {
                recruitId: recruit_id,
                version: version_no,
                paragraphNumber: paragraph_no,
              },
            })
            .then((recording) => {
              if (!recording || isBlank(recording.fileUrl)) {
                res.status(404).json({
                  message: '대상을 찾을 수 없습니다.',
                });
              } else {
                res.sendFile(recording.fileUrl);
              }
            })
            .catch(() => {
              res.status(400).json({
                message: '대상을 조회하는데 실패했습니다.',
              });
            });
        } else {
          res.status(403).json({
            message: '요청자와 성우만 접근 가능합니다.',
          });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '대상을 조회하는데 실패했습니다.',
        });
      });
  }
};

exports.putParagraphFile = (req, res) => {
  const { recruit_id, version_no, paragraph_no } = req.params;
  const { path } = req.file;
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: recruit_id,
        },
      })
      .then((recruit) => {
        if (!recruit) {
          res.status(404).json({
            message: '구인 내용을 찾을 수 없습니다.',
          });
        } else if (recruit.state !== 'WAIT_PROCESS') {
          res.status(400).json({
            message: '파일을 올릴 수 없는 상태입니다.',
          });
        } else if (recruit.actorId === userId) {
          duration(path, (err, length) => {
            if (length < 3) {
              res.status(412).json({
                message: '3초 이하의 파일은 올릴 수 없습니다.',
              });
            } else {
              recordingModel
                .upsert({
                  recruitId: recruit_id,
                  version: version_no,
                  paragraphNumber: paragraph_no,
                  fileUrl: path,
                  fileLength: length,
                })
                .then(() => {
                  res.status(204).json({
                    message: '녹음 파일을 성공적으로 올렸습니다.',
                  });
                })
                .catch(() => {
                  res.status(400).json({
                    message: '녹음 파일을 올리는데 실패했습니다.',
                  });
                });
            }
          });
        } else {
          res.status(403).json({
            message: '채택된 성우만 접근 가능합니다.',
          });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '녹음 파일을 올리는데 실패했습니다.',
        });
      });
  }
};

exports.submitVersion = (req, res) => {
  const { recruit_id, version_no } = req.params;
  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: recruit_id,
        },
      })
      .then((recruit) => {
        if (!recruit) {
          res.status(404).json({
            message: '구인 내용을 찾을 수 없습니다.',
          });
        } else if (recruit.actorId !== userId) {
          res.status(403).json({
            message: '채택된 성우만 작업 가능합니다.',
          });
        } else if (recruit.currentVersion !== Number(version_no) || recruit.state !== 'WAIT_PROCESS') {
          res.status(400).json({
            message: '제출 가능한 상태가 아닙니다.',
          });
        } else {
          paragraphModel
            .count({
              where: {
                recruitId: recruit_id,
              },
            })
            .then((count) => {
              recordingModel
                .findAll({
                  where: {
                    recruitId: recruit_id,
                    version: version_no,
                  },
                })
                .then((recordings) => {
                  if (recordings.length !== count) {
                    res.status(400).json({
                      message: '누락된 녹음 파일이 있습니다.',
                    });
                  } else {
                    for (let i = 0; i < recordings.length; i++) {
                      const recording = recordings[i];
                      if (isBlank(recording.fileUrl)) {
                        res.status(400).json({
                          message: '누락된 녹음 파일이 있습니다.',
                        });
                        return;
                      }
                    }

                    database
                      .transaction()
                      .then((transaction) => {
                        recruit
                          .update({
                            state: 'WAIT_FEEDBACK',
                          }, { transaction })
                          .then(() => {
                            // TODO : 알림 추가 작업
                            transaction.commit();
                            res.status(200).json({
                              message: '제출에 성공했습니다.',
                            });
                          })
                          .catch(() => {
                            transaction.rollback();
                            res.status(400).json({
                              message: '제출에 실패했습니다.',
                            });
                          });
                      })
                      .catch(() => {
                        res.status(400).json({
                          message: '제출에 실패했습니다.',
                        });
                      });
                  }
                })
                .catch(() => {
                  res.status(400).json({
                    message: '제출에 실패했습니다.',
                  });
                });
            })
            .catch(() => {
              res.status(400).json({
                message: '제출에 실패했습니다.',
              });
            });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '제출에 실패했습니다.',
        });
      });
  }
};

exports.getAllFeedback = (req, res) => {
  const { recruit_id, version_no } = req.params;

  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: recruit_id,
        },
      })
      .then((recruit) => {
        if (recruit.actorId !== userId || recruit.clientId !== userId) {
          res.status(403).json({
            message: '채택된 성우나 요청자만 조회 가능합니다.',
          });
        } else {
          const order = [['created_at', 'ASC']];
          const attributes = ['paragraph_number', 'feedback_point', 'feedback_content', 'created_at'];
          feedbackModel
            .findAll({
              attributes,
              where: {
                recruitId: recruit_id,
                version: version_no,
              },
              order,
            })
            .then((feedback) => {
              res.json(feedback);
            })
            .catch(() => {
              res.status(400).json({
                message: '피드백 조회에 실패했습니다.',
              });
            });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '피드백 조회에 실패했습니다.',
        });
      });
  }
};

exports.writeFeedback = (req, res) => {
  const { recruit_id, version_no, paragraph_no } = req.params;
  const { feedback_content, feedback_point } = req.body;

  if (req.session.user === undefined || req.session.user === null) {
    res.status(401).json({
      message: '로그인한 사용자만 조회할 수 있습니다.',
    });
  } else if (isBlank(feedback_content) || feedback_content.length > 1000) {
    res.status(412).json({
      message: '피드백 내용이 부적합합니다.',
    });
  } else {
    const { userId } = req.session.user;
    recruitModel
      .findOne({
        where: {
          recruitId: recruit_id,
        },
      })
      .then((recruit) => {
        if (recruit.clientId !== userId) {
          res.status(403).json({
            message: '요청자만 피드백을 작성할 수 있습니다.',
          });
        } else if (recruit.state !== 'WAIT_FEEDBACK' || recruit.currentVersion !== Number(version_no)) {
          res.status(400).json({
            message: '피드백을 작성할 수 있는 상태가 아닙니다.',
          });
        } else {
          recordingModel
            .findOne({
              where: {
                recruitId: recruit_id,
                version: version_no,
                paragraphNumber: paragraph_no,
              },
            })
            .then((recording) => {
              if (recording.fileLength < feedback_point || feedback_point < 0) {
                res.status(412).json({
                  message: '피드백의 위치가 부적합합니다.',
                });
              } else {
                feedbackModel
                  .create({
                    recruitId: recruit_id,
                    version: version_no,
                    paragraphNumber: paragraph_no,
                    feedbackContent: feedback_content,
                    feedbackPoint: feedback_point,
                    createdAt: Date.now(),
                  })
                  .then((created) => {
                    res.status(201).json(created);
                  })
                  .catch(() => {
                    res.status(400).json({
                      message: '피드백 작성에 실패했습니다.',
                    });
                  });
              }
            })
            .catch(() => {
              res.status(400).json({
                message: '피드백 작성에 실패했습니다.',
              });
            });
        }
      })
      .catch(() => {
        res.status(400).json({
          message: '피드백 작성에 실패했습니다.',
        });
      });
  }
};
