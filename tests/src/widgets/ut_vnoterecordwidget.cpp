/*
* Copyright (C) 2019 ~ 2020 Deepin Technology Co., Ltd.
*
* Author:     zhangteng <zhangteng@uniontech.com>
* Maintainer: zhangteng <zhangteng@uniontech.com>
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* any later version.
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU General Public License for more details.
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
#include "ut_vnoterecordwidget.h"
#include "vnoterecordwidget.h"
#include "utils.h"
#include "stub.h"

static bool stub_startRecord()
{
    return true;
}

UT_VNoteRecordWidget::UT_VNoteRecordWidget()
{
}

void UT_VNoteRecordWidget::SetUp()
{
    m_vnoterecordwidget = new VNoteRecordWidget;
}

void UT_VNoteRecordWidget::TearDown()
{
    delete m_vnoterecordwidget;
}

TEST_F(UT_VNoteRecordWidget, UT_VNoteRecordWidget_startRecord_001)
{
    QAudioFormat audioformat;
    const QByteArray data;
    audioformat.setCodec("audio/pcm");
    //通道，采样率
    audioformat.setChannelCount(2);
    audioformat.setSampleRate(44100);
    //lamemp3enc 编码器插件格式为S16LE
    audioformat.setByteOrder(QAudioFormat::LittleEndian);
    audioformat.setSampleType(QAudioFormat::UnSignedInt);
    audioformat.setSampleSize(16);
    QAudioBuffer buffer(data, audioformat);
    Stub stub;
    stub.set(ADDR(GstreamRecorder, startRecord), stub_startRecord);
    m_vnoterecordwidget->onAudioBufferProbed(buffer);
    EXPECT_EQ(m_vnoterecordwidget->m_recordMsec, -1);
    m_vnoterecordwidget->startRecord();
    EXPECT_FALSE(m_vnoterecordwidget->getRecordPath().isEmpty());
    m_vnoterecordwidget->onRecordDurationChange(4);
    EXPECT_EQ(m_vnoterecordwidget->m_recordMsec, 4);
    m_vnoterecordwidget->stopRecord();
}

TEST_F(UT_VNoteRecordWidget, UT_VNoteRecordWidget_onRecordBtnClicked_001)
{
    m_vnoterecordwidget->onRecordBtnClicked();
}

TEST_F(UT_VNoteRecordWidget, UT_VNoteRecordWidget_onRecordBtnClicked_002)
{
    m_vnoterecordwidget->m_recordBtn->m_state = VNote2SIconButton::Press;
    m_vnoterecordwidget->onRecordBtnClicked();
}

TEST_F(UT_VNoteRecordWidget, UT_VNoteRecordWidget_initRecordPath_001)
{
    m_vnoterecordwidget->initRecordPath();
    EXPECT_FALSE(m_vnoterecordwidget->m_recordDir.isEmpty());
}

TEST_F(UT_VNoteRecordWidget, UT_VNoteRecordWidget_setAudioDevice_001)
{
    m_vnoterecordwidget->setAudioDevice("test");
    EXPECT_EQ(m_vnoterecordwidget->m_audioRecoder->m_currentDevice, "test");
}
