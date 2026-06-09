import csv
import json
import glob

# 自动寻找当前文件夹下的第一个 .csv 文件
csv_files = glob.glob("*.csv")

if not csv_files:
    print("❌ 报错：在当前文件夹没有找到任何 csv 文件，请检查！")
else:
    # 直接使用找到的第一个 csv 文件
    csv_file_path = csv_files[0]
    json_file_path = 'output.json'
    
    print(f"✅ 成功找到文件：{csv_file_path}，正在开始转换...")

    data = []
    
    # 【关键修改】：将读取文件的 encoding 改为了 'gbk'，专门对付 Windows 生成的 CSV
    with open(csv_file_path, mode='r', encoding='gbk') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            for key, value in row.items():
                if value is not None:  # 防止出现空列导致的报错
                    try:
                        row[key] = float(value)
                    except ValueError:
                        pass 
            data.append(row)

    # 写入 JSON 时依然使用标准 utf-8，确保在任何地方打开都不会乱码
    with open(json_file_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4, ensure_ascii=False)

    print(f"🎉 转换大功告成！已在当前文件夹生成 {json_file_path} 文件！")