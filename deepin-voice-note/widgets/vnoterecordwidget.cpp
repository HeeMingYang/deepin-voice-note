#include "vnoterecordwidget.h"
#include "common/utils.h"

#include <QGridLayout>
#include <QHBoxLayout>
#include <QStandardPaths>
#include <QDir>
#include <QDateTime>

VNoteRecordWidget::VNoteRecordWidget(QWidget *parent)
    : DFloatingWidget(parent)
{
    initUi();
    initRecordPath();
    initRecord();
    initConnection();
}

void VNoteRecordWidget::initUi()
{
    m_pauseBtn = new VNoteIconButton(this
                                     , "pause_rec_normal.svg"
                                     , "pause_rec_hover.svg"
                                     , "pause_rec_press.svg");
    m_pauseBtn->setIconSize(QSize(60, 60));
    m_pauseBtn->setFlat(true);

    m_continueBtn = new VNoteIconButton(this
                                        , "record_normal.svg"
                                        , "record_hover.svg"
                                        , "record_press.svg");
    m_continueBtn->setIconSize(QSize(60, 60));
    m_continueBtn->setFlat(true);

    m_finshBtn = new VNoteIconButton(this
                                     , "stop_rec_normal.svg"
                                     , "stop_rec_hover.svg"
                                     , "stop_rec_press.svg");
    m_finshBtn->setIconSize(QSize(60, 60));
    m_finshBtn->setFlat(true);

    QFont recordTimeFont;
    recordTimeFont.setPixelSize(14);
    m_timeLabel = new DLabel(this);
    m_timeLabel->setFont(recordTimeFont);
    m_timeLabel->setText("00:00");

    m_waveForm = new VNWaveform(this);
    QVBoxLayout *waveLayout = new QVBoxLayout;
    waveLayout->addWidget(m_waveForm);
    waveLayout->setContentsMargins(0,15,10,15);

    QHBoxLayout *mainLayout = new QHBoxLayout;
    QGridLayout *btnLayout = new QGridLayout;
    btnLayout->addWidget(m_pauseBtn, 0, 0);
    btnLayout->addWidget(m_continueBtn, 0, 0);
    mainLayout->addLayout(btnLayout);
    mainLayout->addLayout(waveLayout, 1);
    mainLayout->addWidget(m_timeLabel);
    mainLayout->addWidget(m_finshBtn);
    mainLayout->setContentsMargins(0, 0, 0, 0);
    this->setLayout(mainLayout);
    m_continueBtn->setVisible(false);
}

void VNoteRecordWidget::initRecord()
{
    m_audioManager = new VNoteAudioManager(this);
}
void VNoteRecordWidget::initConnection()
{
    connect(m_pauseBtn, &VNoteIconButton::clicked, this, &VNoteRecordWidget::onPauseRecord);
    connect(m_continueBtn, &VNoteIconButton::clicked, this, &VNoteRecordWidget::onContinueRecord);
    connect(m_finshBtn, &VNoteIconButton::clicked, this, &VNoteRecordWidget::onSetMediaSource);
    connect(m_audioManager, SIGNAL(recAudioBufferProbed(const QAudioBuffer &)),
            this, SLOT(onAudioBufferProbed(const QAudioBuffer &)));
    connect(m_audioManager, &VNoteAudioManager::recExceedLimit, this, &VNoteRecordWidget::onSetMediaSource);
    connect(m_audioManager->getPlayerObject(),&QMediaPlayer::durationChanged,
            this,&VNoteRecordWidget::onMediaDurationChange);
}

void VNoteRecordWidget::initRecordPath()
{
    m_recordDir = QStandardPaths::writableLocation(QStandardPaths::AppDataLocation);
    m_recordDir += "/voicenote/";
    QDir dir(m_recordDir);
    if (!dir.exists()) {
        dir.mkdir(m_recordDir);
    }
}

void VNoteRecordWidget::onSetMediaSource()
{
     m_audioManager->stopRecord();
     m_audioManager->setPlayFileName(m_recordPath);
}

void VNoteRecordWidget::onPauseRecord()
{
    m_pauseBtn->setVisible(false);
    m_continueBtn->setVisible(true);
    m_audioManager->pauseRecord();
}

void VNoteRecordWidget::onContinueRecord()
{
    m_pauseBtn->setVisible(true);
    m_continueBtn->setVisible(false);
    m_audioManager->startRecord();
}

void VNoteRecordWidget::startRecord()
{
    QString strTime = QDateTime::currentDateTime()
                      .toString("yyyyMMddhhmmss");
    QString fileName = "NewVoiceNote";
    fileName += strTime + ".mp3";
    m_recordPath = m_recordDir + fileName;
    m_audioManager->setRecordFileName(m_recordPath);
    m_recordMsec = 0;
    m_timeLabel->setText("00:00");
    m_audioManager->startRecord();
}

void VNoteRecordWidget::cancelRecord()
{
    onSetMediaSource();
}

void VNoteRecordWidget::onAudioBufferProbed(const QAudioBuffer &buffer)
{
    m_recordMsec = buffer.startTime() / 1000;
    QString strTime = Utils::formatMillisecond(m_recordMsec);
    if (m_timeLabel->text() != strTime) {
        m_timeLabel->setText(strTime);
    }
    m_waveForm->onAudioBufferProbed(buffer);
}

void VNoteRecordWidget::onMediaDurationChange(qint64 duration)
{
    if(duration >= m_recordMsec){
      qDebug() << "duration 1:" << m_recordMsec << ";duration 2:" << duration;
      emit sigFinshRecord(m_recordPath, duration);
    }
}
